import React, { useState, useEffect, useMemo } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { ShieldAlert, Database, Lock, Fingerprint, Activity, AlertTriangle } from 'lucide-react';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { StoreService } from '@/services/storeService';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';

type CycleEntry = {
    id: string;
    date: string;
    flow_level: 'Ninguno' | 'Bajo' | 'Medio' | 'Alto' | '';
    is_atypical: boolean;
    symptoms_enc: string;
    notes_enc: string;
};

type BiometricState = {
    cycles: CycleEntry[];
    luteal_constant: number;
};

const encrypt = (text: string) => btoa(encodeURIComponent(text));
const decrypt = (hash: string) => {
    try {
        return decodeURIComponent(atob(hash));
    } catch {
        return '';
    }
};

const FLO_SYMPTOMS = ['Cólicos', 'Hinchazón', 'Cambios de Humor', 'Fatiga', 'Ansiedad', 'Migraña'];

export const BiometricVault = () => {
    const { profile } = useProfile();
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
    const secondaryColor = profile === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';
    const secondaryClass = profile === 'ella' ? 'user-b' : 'user-a';
    const [state, setState] = useState<BiometricState>({ cycles: [], luteal_constant: 14 });
    const [isClient, setIsClient] = useState(false);
    
    const [dateInput, setDateInput] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [flowLevel, setFlowLevel] = useState<CycleEntry['flow_level']>('');
    const [isAtypical, setIsAtypical] = useState(false);
    const [notes, setNotes] = useState('');
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

    useEffect(() => {
        setIsClient(true);
        const stored = localStorage.getItem('symmetry_biometrics');
        if (stored) setState(JSON.parse(stored));
    }, []);

    const saveState = (newState: BiometricState) => {
        setState(newState);
        localStorage.setItem('symmetry_biometrics', JSON.stringify(newState));
    };

    const engineStats = useMemo(() => {
        if (!state.cycles || state.cycles.length === 0) return null;

        const sorted = [...state.cycles].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const latestCycleDate = parseISO(sorted[sorted.length - 1].date);
        const daysSinceLast = differenceInDays(new Date(), latestCycleDate);

        const validCycles = sorted.filter(c => !c.is_atypical);
        let predictedCycleLength = 28;
        
        if (validCycles.length > 1) {
            let weightedSum = 0;
            let weightTotal = 0;

            for (let i = 1; i < validCycles.length; i++) {
                const prevDate = parseISO(validCycles[i-1].date);
                const currDate = parseISO(validCycles[i].date);
                const length = differenceInDays(currDate, prevDate);

                if (length > 45) continue;

                let weight = 0.1;
                if (i === validCycles.length - 1) weight = 5;
                else if (i === validCycles.length - 2) weight = 2;

                weightedSum += length * weight;
                weightTotal += weight;
            }

            if (weightTotal > 0) predictedCycleLength = Math.round(weightedSum / weightTotal);
        }

        const predictedNextDate = addDays(latestCycleDate, predictedCycleLength);
        
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

        let currentPhase = 'Menstrual';
        if (daysSinceLast <= 5) currentPhase = 'Menstrual';
        else if (daysSinceLast > 5 && daysSinceLast < fertileStart) currentPhase = 'Folicular';
        else if (daysSinceLast >= fertileStart && daysSinceLast <= fertileEnd) currentPhase = 'Ovulatoria';
        else currentPhase = 'Lútea';

        // Tendencias
        const recentCycles = validCycles.slice(-3);
        const frequentSymptoms = FLO_SYMPTOMS.filter(sym => {
            const count = recentCycles.filter(c => decrypt(c.symptoms_enc).includes(sym)).length;
            return count >= 2;
        });

        let warningSignal = '';
        if (currentPhase === 'Lútea') {
            if (frequentSymptoms.includes('Ansiedad')) warningSignal = 'Ansiedad detectada como tendencia pre-menstrual.';
            if (frequentSymptoms.includes('Migraña')) warningSignal = 'Migraña probable en los próximos días.';
        }

        const confidenceScore = Math.min(validCycles.length * 25, 100);

        return {
            predictedNextDate,
            predictedCycleLength,
            daysSinceLast,
            currentPhase,
            fertileWindowStart,
            fertileWindowEnd,
            confidenceScore,
            latestCycleDate,
            frequentSymptoms,
            warningSignal
        };

    }, [state.cycles]);

    const handleLogCycle = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!flowLevel) {
            alert('Por favor, selecciona un nivel de flujo para continuar.');
            return;
        }

        const newDateParsed = parseISO(dateInput);
        const hasCollision = state.cycles.some(c => Math.abs(differenceInDays(parseISO(c.date), newDateParsed)) < 14);

        if (hasCollision && !isAtypical) {
            alert('Sangrado inusual detectado fuera de tu ciclo menstrual habitual. ¿Deseas marcar este registro como atípico?');
            return;
        }

        const newEntry: CycleEntry = {
            id: Date.now().toString(),
            date: dateInput,
            flow_level: flowLevel,
            is_atypical: isAtypical,
            symptoms_enc: encrypt(selectedSymptoms.join(', ')),
            notes_enc: encrypt(notes)
        };

        saveState({
            ...state,
            cycles: [...state.cycles, newEntry]
        });

        // Enviar notificación muy discreta a la pareja si es Milena
        if (profile === 'ella') {
            const hasMoodSymptoms = selectedSymptoms.includes('Cambios de Humor') || selectedSymptoms.includes('Ansiedad');
            const target = 'el';
            const bioMsg = hasMoodSymptoms 
                ? '¡Diario de Bienestar!: Se registró un cambio de ánimo hoy.'
                : '¡Diario de Bienestar!: Hay un nuevo registro en el diario.';
            StoreService.addNotification(target, 'biometrics', bioMsg).catch(err => console.error(err));
        }

        setSelectedSymptoms([]);
        setNotes('');
        setFlowLevel('');
        setIsAtypical(false);
    };

    const toggleSymptom = (sym: string) => {
        setSelectedSymptoms(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);
    };

    const handleDelete = (id: string) => {
        saveState({ ...state, cycles: state.cycles.filter(c => c.id !== id) });
    };

    const getPartnerTranslation = () => {
        if (!engineStats) return "Fase de Estabilización. Monitoreo en curso.";
        
        let base = "";
        switch (engineStats.currentPhase) {
            case 'Menstrual': 
                base = "Enfoque en recuperación física. Alto requerimiento de descanso. Sugerencia: Asumir tareas del hogar.";
                break;
            case 'Folicular': 
                base = "Energía en aumento. Momento óptimo para planear salidas o tareas complejas.";
                break;
            case 'Ovulatoria': 
                base = "Pico de energía social y física. Alta ventana de conexión.";
                break;
            case 'Lútea': 
                base = "Aumento de sensibilidad hormonal. Sugerencia: Implementar entorno de baja presión y reducir compromisos sociales.";
                break;
            default: 
                base = "Fase de Estabilización. Monitoreo en curso.";
        }

        if (engineStats.currentPhase === 'Lútea' && engineStats.frequentSymptoms.includes('Ansiedad')) {
            base += " - Alerta de Tendencia: Ansiedad probable. Maximizar entorno de baja fricción.";
        }
        if (engineStats.frequentSymptoms.includes('Cólicos') && (engineStats.currentPhase === 'Lútea' || engineStats.currentPhase === 'Menstrual')) {
            base += " - Alerta de Tendencia: Probabilidad Alta de Cólicos. Sugerencia: Tener analgésicos o infusiones a mano.";
        }

        return base;
    };

    if (!isClient) return null;

    const isSovereign = profile === 'ella';

    return (
        <div className="relative overflow-hidden border border-white/10 bg-[#0a0a0a] p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-mosaic opacity-35" />
            <AnimatedBrutalistCorners color="#ff4b89" size={12} thickness={1.5} />
            
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Fingerprint size={120} className="text-[#ff4b89]" />
            </div>
            
            <h2 className="relative z-10 mb-8 flex items-center justify-between border-b border-white/5 pb-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#ff4b89]">
                <span className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-[#ff4b89]" /> Mi Diario de Bienestar</span>
                <span className="hidden font-mono text-[8px] text-[#594137] sm:inline">DATOS ENCRIPTADOS Y PRIVADOS</span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                <div className="lg:col-span-7 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="flex flex-col items-center justify-center border border-white/10 bg-black/60 p-4 text-center">
                            <span className="mb-1 text-[8px] uppercase tracking-widest text-[#a88a7e]">Estado</span>
                            <span className="font-mono text-sm text-white">
                                {engineStats ? `DÍA ${engineStats.daysSinceLast}` : 'N/A'}
                            </span>
                        </div>
                        <div className="flex flex-col items-center justify-center border border-white/10 bg-black/60 p-4 text-center">
                            <span className="mb-1 text-[8px] uppercase tracking-widest text-[#a88a7e]">Índice Confianza</span>
                            <span className={`font-mono text-sm text-${accentClass}`} style={{ color: accentColor }}>
                                {engineStats ? `${engineStats.confidenceScore}%` : '0%'}
                            </span>
                        </div>
                        <div className="flex flex-col items-center justify-center border border-white/10 bg-black/60 p-4 text-center">
                            <span className="mb-1 text-[8px] uppercase tracking-widest text-[#a88a7e]">Ciclo Previsto</span>
                            <span className="font-mono text-sm text-white">
                                {engineStats ? `${engineStats.predictedCycleLength}D` : 'N/A'}
                            </span>
                        </div>
                        <div className="flex flex-col items-center justify-center border border-white/10 bg-black/60 p-4 text-center">
                            <span className="mb-1 text-[8px] uppercase tracking-widest text-[#a88a7e]">Varianza</span>
                            <span className="font-mono text-sm text-white">
                                ±15%
                            </span>
                        </div>
                    </div>

                    <div className="border border-white/10 bg-black p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] uppercase tracking-widest text-[#a88a7e]">Mis Fases y Calendario</span>
                            <span className="font-mono text-[9px] text-[#594137]">Duración de fase: {state.luteal_constant} días</span>
                        </div>
                        
                        {engineStats ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs font-mono">
                                    <div className="flex flex-col">
                                        <span className="mb-1 text-[8px] uppercase tracking-wider text-[#a88a7e]">Último Registro</span>
                                        <span className={`border border-${accentClass}/50 px-2 py-1 text-${accentClass}`} style={{ borderColor: `${accentColor}80`, color: accentColor, backgroundColor: `${accentColor}1a` }}>
                                            {format(engineStats.latestCycleDate, 'MMM dd, yyyy')}
                                        </span>
                                    </div>
                                    <div className="mx-4 flex-1 border-t border-dashed border-white/10" />
                                    <div className="flex flex-col items-end">
                                        <span className="mb-1 text-[8px] uppercase tracking-wider text-[#a88a7e]">Inicio Previsto</span>
                                        <span className={`border border-dashed border-${secondaryClass}/50 px-2 py-1 text-${secondaryClass}`} style={{ borderColor: `${secondaryColor}80`, color: secondaryColor, backgroundColor: `${secondaryColor}1a` }}>
                                            {format(engineStats.predictedNextDate, 'MMM dd, yyyy')}
                                        </span>
                                    </div>
                                </div>
                                
                                {!isSovereign && (
                                    <div className="mt-6 border border-white/10 bg-[#0a0a0a] p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShieldAlert className={`h-4 w-4 text-${accentClass}`} style={{ color: accentColor }} />
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#a88a7e]">Consejos de Cuidado Mutuo</span>
                                        </div>
                                        <p className="text-sm font-light tracking-normal text-[#e1bfb2]">
                                            &quot;{getPartnerTranslation()}&quot;
                                        </p>
                                    </div>
                                )}

                                {!isSovereign && engineStats.warningSignal && (
                                    <div className="mt-2 p-3 border border-yellow-900 bg-yellow-950/20 rounded-none flex items-start gap-3">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                        <span className="text-xs text-yellow-600 font-mono">{engineStats.warningSignal}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-stone-600 text-xs uppercase tracking-widest">
                                ¡Aún no hay registros este mes!
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-5">
                    {isSovereign ? (
                        <div className="border border-white/10 bg-black p-6">
                            <h3 className={`text-[9px] uppercase tracking-widest text-${accentClass} font-bold mb-4 flex items-center gap-2`} style={{ color: accentColor }}>
                                <Database className="w-3 h-3" /> Mis Datos Privados
                            </h3>
                            <form onSubmit={handleLogCycle} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[8px] uppercase tracking-widest text-stone-500 mb-1">Fecha</label>
                                        <input 
                                            type="date" 
                                            value={dateInput}
                                            onChange={e => setDateInput(e.target.value)}
                                            className={`w-full border border-white/10 bg-[#0a0a0a] p-2 font-mono text-xs text-white outline-none focus:border-${accentClass}`}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] uppercase tracking-widest text-stone-500 mb-1">Nivel de Flujo *</label>
                                        <select 
                                            value={flowLevel}
                                            onChange={e => setFlowLevel(e.target.value as any)}
                                            className={`w-full appearance-none border border-white/10 bg-[#0a0a0a] p-2 font-mono text-xs text-white outline-none focus:border-${accentClass}`}
                                            required
                                        >
                                            <option value="" disabled>Seleccionar Flujo</option>
                                            <option value="Ninguno">Ninguno</option>
                                            <option value="Bajo">Bajo</option>
                                            <option value="Medio">Medio</option>
                                            <option value="Alto">Alto</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-[8px] uppercase tracking-widest text-stone-500 mb-2 flex justify-between">
                                        <span>Registro de Síntomas (Privado)</span>
                                        <Lock className="w-3 h-3 text-stone-600" />
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {FLO_SYMPTOMS.map(sym => (
                                            <label key={sym} className="flex cursor-pointer items-center gap-2 border border-white/10 bg-[#0a0a0a] p-2">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedSymptoms.includes(sym)}
                                                    onChange={() => toggleSymptom(sym)}
                                                    className={`accent-${accentClass} rounded-none`}
                                                />
                                                <span className="text-[10px] uppercase text-stone-400">{sym}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[8px] uppercase tracking-widest text-stone-500 mb-1 flex justify-between">
                                        <span>Notas del día (Privadas)</span>
                                        <Lock className="w-3 h-3 text-stone-600" />
                                    </label>
                                    <textarea 
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className={`h-16 w-full resize-none border border-white/10 bg-[#0a0a0a] p-2 font-mono text-xs text-white outline-none focus:border-${accentClass}`}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        id="atypical"
                                        checked={isAtypical}
                                        onChange={e => setIsAtypical(e.target.checked)}
                                        className={`accent-${accentClass} rounded-none`}
                                    />
                                    <label htmlFor="atypical" className="text-[9px] uppercase tracking-widest text-stone-400 cursor-pointer">
                                        Marcar como atípico (no incluir en las fases)
                                    </label>
                                </div>

                                <button type="submit" className={`w-full border border-${accentClass} bg-${accentClass}/20 py-3 text-[10px] font-bold uppercase tracking-widest text-${accentClass} transition-colors hover:bg-${accentClass}/40`} style={{ borderColor: `${accentColor}80`, color: accentColor }}>
                                    Guardar de Forma Segura
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="flex h-full min-h-[200px] flex-col items-center justify-center border border-white/10 bg-black p-6 text-center">
                            <Lock className="w-8 h-8 text-stone-700 mb-4" />
                            <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2">
                                Datos Protegidos (Privados)
                            </h3>
                            <p className="text-xs text-stone-600 font-mono">
                                Acceso reservado por privacidad. Modo de lectura: Consejos de cuidado.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {state.cycles.length > 0 && (
                <div className="relative z-10 mt-8 border-t border-white/10 pt-6">
                    <h3 className="mb-4 flex justify-between text-[9px] uppercase tracking-widest text-[#a88a7e]">
                        <span>Historial de Bienestar</span>
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                        {[...state.cycles].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(cycle => (
                            <div key={cycle.id} className="flex items-center justify-between border border-white/10 bg-black/40 p-3">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono text-stone-300">{format(parseISO(cycle.date), 'MM.dd.yy')}</span>
                                    {cycle.is_atypical && <span className="text-[8px] bg-yellow-900/30 text-yellow-500 px-1 border border-yellow-900 rounded-none">ATÍPICO</span>}
                                    <span className="text-[9px] uppercase text-stone-500">Flujo: {cycle.flow_level}</span>
                                </div>
                                
                                {isSovereign ? (
                                    <div className="flex items-center gap-4">
                                        <div className="text-[9px] text-stone-500 hidden md:block max-w-[200px] truncate">
                                            S: {decrypt(cycle.symptoms_enc) || 'Ninguno'} | N: {decrypt(cycle.notes_enc) || 'N/A'}
                                        </div>
                                        <button onClick={() => handleDelete(cycle.id)} className={`text-stone-600 hover:text-${accentClass} text-[10px] uppercase`}>Eliminar</button>
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
