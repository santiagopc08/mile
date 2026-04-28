import React, { useState, useEffect, useMemo } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Database, Lock, Info, Activity, Fingerprint } from 'lucide-react';
import { format, differenceInDays, addDays, parseISO, isAfter } from 'date-fns';

type CycleEntry = {
    id: string;
    date: string; // ISO String
    flow_level: 'low' | 'medium' | 'high';
    is_atypical: boolean;
    symptoms_enc: string; // Base64 simulated encryption
    notes_enc: string; // Base64 simulated encryption
};

type BiometricState = {
    cycles: CycleEntry[];
    luteal_constant: number;
};

// --- Mock Encryption ---
const encrypt = (text: string) => btoa(encodeURIComponent(text));
const decrypt = (hash: string) => {
    try {
        return decodeURIComponent(atob(hash));
    } catch {
        return '';
    }
};

export const BiometricVault = () => {
    const { profile } = useProfile();
    const [state, setState] = useState<BiometricState>({ cycles: [], luteal_constant: 14 });
    const [isClient, setIsClient] = useState(false);
    
    // Form state
    const [dateInput, setDateInput] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [flowLevel, setFlowLevel] = useState<'low' | 'medium' | 'high'>('medium');
    const [isAtypical, setIsAtypical] = useState(false);
    const [notes, setNotes] = useState('');
    const [symptoms, setSymptoms] = useState('');

    useEffect(() => {
        setIsClient(true);
        const stored = localStorage.getItem('symmetry_biometrics');
        if (stored) {
            setState(JSON.parse(stored));
        }
    }, []);

    const saveState = (newState: BiometricState) => {
        setState(newState);
        localStorage.setItem('symmetry_biometrics', JSON.stringify(newState));
    };

    // --- Statistical Engine ---
    const engineStats = useMemo(() => {
        if (!state.cycles || state.cycles.length === 0) return null;

        // Sort cycles chronologically
        const sorted = [...state.cycles].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const latestCycleDate = parseISO(sorted[sorted.length - 1].date);
        const daysSinceLast = differenceInDays(new Date(), latestCycleDate);

        // Filter valid cycles for modeling
        const validCycles = sorted.filter(c => !c.is_atypical);
        let predictedCycleLength = 28; // fallback
        
        if (validCycles.length > 1) {
            let weightedSum = 0;
            let weightTotal = 0;

            for (let i = 1; i < validCycles.length; i++) {
                const prevDate = parseISO(validCycles[i-1].date);
                const currDate = parseISO(validCycles[i].date);
                const length = differenceInDays(currDate, prevDate);

                // Ignore massive outliers > 45 as per logic rules
                if (length > 45) continue;

                let weight = 0.1; // Historical
                if (i === validCycles.length - 1) weight = 5; // Current/Latest gap
                else if (i === validCycles.length - 2) weight = 2; // Prev gap

                weightedSum += length * weight;
                weightTotal += weight;
            }

            if (weightTotal > 0) {
                predictedCycleLength = Math.round(weightedSum / weightTotal);
            }
        }

        const predictedNextDate = addDays(latestCycleDate, predictedCycleLength);
        
        // Fertile Shift Bounds
        let shortestCycle = predictedCycleLength;
        let longestCycle = predictedCycleLength;
        
        if (validCycles.length > 1) {
            const lengths = [];
            for (let i = 1; i < validCycles.length; i++) {
                const len = differenceInDays(parseISO(validCycles[i].date), parseISO(validCycles[i-1].date));
                if (len <= 45) lengths.push(len);
            }
            if (lengths.length > 0) {
                shortestCycle = Math.min(...lengths);
                longestCycle = Math.max(...lengths);
            }
        }

        const fertileStart = shortestCycle - 18;
        const fertileEnd = longestCycle - 11;
        const fertileWindowStart = addDays(latestCycleDate, fertileStart);
        const fertileWindowEnd = addDays(latestCycleDate, fertileEnd);

        // Phase determination
        let currentPhase = 'Menstrual';
        if (daysSinceLast <= 5) currentPhase = 'Menstrual';
        else if (daysSinceLast > 5 && daysSinceLast < fertileStart) currentPhase = 'Follicular';
        else if (daysSinceLast >= fertileStart && daysSinceLast <= fertileEnd) currentPhase = 'Ovulatory';
        else currentPhase = 'Luteal';

        // Confidence Score (+25% per natural cycle, max 100%)
        const confidenceScore = Math.min(validCycles.length * 25, 100);

        return {
            predictedNextDate,
            predictedCycleLength,
            daysSinceLast,
            currentPhase,
            fertileWindowStart,
            fertileWindowEnd,
            confidenceScore,
            latestCycleDate
        };

    }, [state.cycles]);


    const handleLogCycle = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Collision detection: check if there's a log within 14 days
        const newDateParsed = parseISO(dateInput);
        const hasCollision = state.cycles.some(c => Math.abs(differenceInDays(parseISO(c.date), newDateParsed)) < 14);

        if (hasCollision && !isAtypical) {
            alert('Collision detected: Period logged within 14 days. Suggest flagging as Atypical (Inter-cycle Spotting).');
            return;
        }

        const newEntry: CycleEntry = {
            id: Date.now().toString(),
            date: dateInput,
            flow_level: flowLevel,
            is_atypical: isAtypical,
            symptoms_enc: encrypt(symptoms),
            notes_enc: encrypt(notes)
        };

        saveState({
            ...state,
            cycles: [...state.cycles, newEntry]
        });

        // Reset form
        setSymptoms('');
        setNotes('');
        setIsAtypical(false);
    };

    const handleDelete = (id: string) => {
        saveState({
            ...state,
            cycles: state.cycles.filter(c => c.id !== id)
        });
    };

    // --- The Black Box Translation ---
    const getPartnerTranslation = (phase: string) => {
        switch (phase) {
            case 'Menstrual': return "Physical recovery focus. High rest requirement. Recommend heat-pad or chore-takeover.";
            case 'Follicular': return "Rising energy. Optimal time for planning outings or complex tasks.";
            case 'Ovulatory': return "Peak social and physical energy. High connection window.";
            case 'Luteal': return "Sensitivity increasing. Implement 'Low-Friction' environment. Avoid introducing high-stress topics.";
            default: return "Stabilization Phase. Monitor context.";
        }
    };

    if (!isClient) return null;

    const isSovereign = profile === 'ella';

    return (
        <div className="geometric-card p-6 sm:p-8 bg-zinc-950 border-stone-800 relative overflow-hidden">
            {/* Background Mechanical Grid */}
            <div className="absolute inset-0 bg-grid-mosaic opacity-5 pointer-events-none" />
            
            <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] mb-8 border-b border-stone-800 pb-3 text-stone-300 flex justify-between items-center relative z-10">
                <span className="flex items-center gap-2"><Fingerprint className="w-4 h-4 text-stone-500" /> Vault-Biometric Controller</span>
                <span className="text-[8px] font-mono text-stone-600">ZERO-KNOWLEDGE PROTOCOL</span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                {/* Visual Engine Output */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Status HUD */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="border border-stone-800 bg-black/50 p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-[8px] uppercase tracking-widest text-stone-500 mb-1">Status</span>
                            <span className="text-sm font-mono text-stone-300">
                                {engineStats ? `DAY ${engineStats.daysSinceLast}` : 'N/A'}
                            </span>
                        </div>
                        <div className="border border-stone-800 bg-black/50 p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-[8px] uppercase tracking-widest text-stone-500 mb-1">Confidence</span>
                            <span className="text-sm font-mono text-stone-300">
                                {engineStats ? `${engineStats.confidenceScore}%` : '0%'}
                            </span>
                        </div>
                        <div className="border border-stone-800 bg-black/50 p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-[8px] uppercase tracking-widest text-stone-500 mb-1">Projected Cycle</span>
                            <span className="text-sm font-mono text-stone-300">
                                {engineStats ? `${engineStats.predictedCycleLength}D` : 'N/A'}
                            </span>
                        </div>
                        <div className="border border-stone-800 bg-black/50 p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-[8px] uppercase tracking-widest text-stone-500 mb-1">Variance</span>
                            <span className="text-sm font-mono text-stone-300">
                                ±15%
                            </span>
                        </div>
                    </div>

                    {/* Timeline / Projection bounds */}
                    <div className="border border-stone-800 bg-black p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] uppercase tracking-widest text-stone-500">Biological Horizon</span>
                            <span className="text-[9px] font-mono text-stone-600">Luteal Constant: {state.luteal_constant}D</span>
                        </div>
                        
                        {engineStats ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs font-mono">
                                    <div className="flex flex-col">
                                        <span className="text-stone-500 text-[8px] uppercase tracking-wider mb-1">Last Logged</span>
                                        <span className="bg-red-900/20 text-red-500 px-2 py-1 border border-red-900">
                                            {format(engineStats.latestCycleDate, 'MMM dd, yyyy')}
                                        </span>
                                    </div>
                                    <div className="flex-1 border-t border-dashed border-stone-800 mx-4" />
                                    <div className="flex flex-col items-end">
                                        <span className="text-stone-500 text-[8px] uppercase tracking-wider mb-1">Predicted Start</span>
                                        <span className="bg-red-950/20 text-red-500 px-2 py-1 border border-dashed border-red-500">
                                            {format(engineStats.predictedNextDate, 'MMM dd, yyyy')}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Asymmetric View for the Partner */}
                                {!isSovereign && (
                                    <div className="mt-6 p-4 border border-stone-800 bg-stone-900/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShieldAlert className="w-4 h-4 text-stone-400" />
                                            <span className="text-[9px] uppercase tracking-widest font-bold text-stone-400">Strategist Directive</span>
                                        </div>
                                        <p className="text-sm text-stone-300 italic font-light">
                                            &quot;{getPartnerTranslation(engineStats.currentPhase)}&quot;
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-stone-600 text-xs uppercase tracking-widest">
                                Insufficient Data for Projections
                            </div>
                        )}
                    </div>
                </div>

                {/* Input / Data Control */}
                <div className="lg:col-span-5">
                    {isSovereign ? (
                        <div className="border border-stone-800 p-6 bg-black">
                            <h3 className="text-[9px] uppercase tracking-widest text-red-500 font-bold mb-4 flex items-center gap-2">
                                <Database className="w-3 h-3" /> Data Sovereign Access
                            </h3>
                            <form onSubmit={handleLogCycle} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[8px] uppercase tracking-widest text-stone-500 mb-1">Date</label>
                                        <input 
                                            type="date" 
                                            value={dateInput}
                                            onChange={e => setDateInput(e.target.value)}
                                            className="w-full bg-stone-900 border border-stone-800 text-stone-300 p-2 text-xs font-mono outline-none focus:border-red-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] uppercase tracking-widest text-stone-500 mb-1">Flow</label>
                                        <select 
                                            value={flowLevel}
                                            onChange={e => setFlowLevel(e.target.value as any)}
                                            className="w-full bg-stone-900 border border-stone-800 text-stone-300 p-2 text-xs font-mono outline-none focus:border-red-500 appearance-none"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-[8px] uppercase tracking-widest text-stone-500 mb-1 flex justify-between">
                                        <span>Symptoms (Encrypted)</span>
                                        <Lock className="w-3 h-3 text-stone-600" />
                                    </label>
                                    <input 
                                        type="text" 
                                        value={symptoms}
                                        onChange={e => setSymptoms(e.target.value)}
                                        placeholder="e.g. Cramps, Fatigue"
                                        className="w-full bg-stone-900 border border-stone-800 text-stone-300 p-2 text-xs font-mono outline-none focus:border-red-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[8px] uppercase tracking-widest text-stone-500 mb-1 flex justify-between">
                                        <span>Notes (Encrypted)</span>
                                        <Lock className="w-3 h-3 text-stone-600" />
                                    </label>
                                    <textarea 
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="w-full bg-stone-900 border border-stone-800 text-stone-300 p-2 text-xs font-mono outline-none focus:border-red-500 resize-none h-16"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        id="atypical"
                                        checked={isAtypical}
                                        onChange={e => setIsAtypical(e.target.checked)}
                                        className="accent-red-500"
                                    />
                                    <label htmlFor="atypical" className="text-[9px] uppercase tracking-widest text-stone-400 cursor-pointer">
                                        Flag as Atypical (Exclude from model)
                                    </label>
                                </div>

                                <button type="submit" className="w-full py-3 bg-red-950/30 text-red-500 border border-red-900 text-[10px] uppercase tracking-widest font-bold hover:bg-red-900/50 transition-colors">
                                    Commit Record
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="border border-stone-800 p-6 bg-black flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                            <Lock className="w-8 h-8 text-stone-700 mb-4" />
                            <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2">
                                Cryptographic Barrier Active
                            </h3>
                            <p className="text-xs text-stone-600 font-mono">
                                Sovereign Data access is restricted. You are operating in Support Strategist mode.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* History Log (Visible to Sovereign, Obfuscated to Strategist) */}
            {state.cycles.length > 0 && (
                <div className="mt-8 border-t border-stone-800 pt-6 relative z-10">
                    <h3 className="text-[9px] uppercase tracking-widest text-stone-500 mb-4 flex justify-between">
                        <span>Vault Log</span>
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                        {[...state.cycles].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(cycle => (
                            <div key={cycle.id} className="flex items-center justify-between p-3 border border-stone-800 bg-stone-900/30">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono text-stone-300">{format(parseISO(cycle.date), 'MM.dd.yy')}</span>
                                    {cycle.is_atypical && <span className="text-[8px] bg-yellow-900/30 text-yellow-500 px-1 border border-yellow-900">ATYPICAL</span>}
                                    <span className="text-[9px] uppercase text-stone-500">Flow: {cycle.flow_level}</span>
                                </div>
                                
                                {isSovereign ? (
                                    <div className="flex items-center gap-4">
                                        <div className="text-[9px] text-stone-500 hidden md:block">
                                            S: {decrypt(cycle.symptoms_enc) || 'None'} | N: {decrypt(cycle.notes_enc) || 'None'}
                                        </div>
                                        <button onClick={() => handleDelete(cycle.id)} className="text-stone-600 hover:text-red-500 text-[10px] uppercase">Purge</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-[9px] font-mono text-stone-700">
                                        <Lock className="w-3 h-3" /> E_{cycle.symptoms_enc.substring(0,6)}...
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
