import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Clock, Shield, Compass, Activity, Dumbbell, Zap, Heart, Smile } from 'lucide-react';
import { SessionCategory, DifficultyLevel, EnergyLevel, CompletionStatus, MobilityStatus } from './types';

const CATEGORY_LABELS: Record<SessionCategory, { label: string; icon: any; isTherapy: boolean }> = {
    physical_therapy: { label: 'Terapia Física', icon: Heart, isTherapy: true },
    occupational_therapy: { label: 'Terapia Ocupacional', icon: Compass, isTherapy: true },
    mobility: { label: 'Movilidad', icon: Activity, isTherapy: false },
    stretching: { label: 'Estiramiento', icon: Compass, isTherapy: false },
    recovery: { label: 'Recuperación Activa', icon: Smile, isTherapy: false },
    strength: { label: 'Fuerza', icon: Dumbbell, isTherapy: false },
    cardio: { label: 'Cardio', icon: Zap, isTherapy: false },
    legs: { label: 'Pierna', icon: Dumbbell, isTherapy: false },
    core: { label: 'Core / Abdomen', icon: Shield, isTherapy: false }
};

interface QuickLogFormProps {
    isElla: boolean;
    accentColor: string;
    isSubmitting: boolean;
    sessionType: SessionCategory;
    setSessionType: (v: SessionCategory) => void;
    duration: number | '';
    setDuration: (v: number | '') => void;
    difficulty: DifficultyLevel;
    setDifficulty: (v: DifficultyLevel) => void;
    energyLevel: EnergyLevel;
    setEnergyLevel: (v: EnergyLevel) => void;
    completionStatus: CompletionStatus;
    setCompletionStatus: (v: CompletionStatus) => void;
    notes: string;
    setNotes: (v: string) => void;
    showTherapyFields: boolean;
    painBefore: number | '';
    setPainBefore: (v: number | '') => void;
    painAfter: number | '';
    setPainAfter: (v: number | '') => void;
    fatigueLevel: number | '';
    setFatigueLevel: (v: number | '') => void;
    mobilityStatus: MobilityStatus;
    setMobilityStatus: (v: MobilityStatus) => void;
    therapistNotes: string;
    setTherapistNotes: (v: string) => void;
    handleLogSession: (e?: React.FormEvent) => Promise<void>;
    applyPreset: (preset: any) => void;
    presetsEl: any[];
    presetsElla: any[];
}

export function QuickLogForm({
    isElla,
    accentColor,
    isSubmitting,
    sessionType,
    setSessionType,
    duration,
    setDuration,
    difficulty,
    setDifficulty,
    energyLevel,
    setEnergyLevel,
    completionStatus,
    setCompletionStatus,
    notes,
    setNotes,
    showTherapyFields,
    painBefore,
    setPainBefore,
    painAfter,
    setPainAfter,
    fatigueLevel,
    setFatigueLevel,
    mobilityStatus,
    setMobilityStatus,
    therapistNotes,
    setTherapistNotes,
    handleLogSession,
    applyPreset,
    presetsEl,
    presetsElla
}: QuickLogFormProps) {
    return (
        <>
                    {/* CAPA 3: FORMULARIO DE REGISTRO RÁPIDO */}
                    <div className="border border-white/10 bg-[#080808] p-6 relative rounded-none">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30" />

                        <h3 className="text-[10px] uppercase font-black tracking-[0.25em] text-[#a88a7e] mb-5 border-b border-white/5 pb-3 flex items-center justify-between font-mono">
                            <span>Registrar mi Actividad Física</span>
                            <span className="text-[8px] opacity-40">Registro Diario</span>
                        </h3>

                        {/* Presets / Quick Logging Buttons */}
                        <div className="mb-6 space-y-2.5">
                            <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40 block font-mono">
                                Cargar ejercicio frecuente (Preajustes de {isElla ? 'Ella' : 'Él'}):
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {(isElla ? presetsElla : presetsEl).map((preset: any, index: number) => {
                                    const label = CATEGORY_LABELS[preset.session_type as SessionCategory]?.label || preset.session_type;
                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => applyPreset(preset)}
                                            className="px-2 py-2 border border-white/10 bg-white/[0.01] hover:bg-white/[0.05] text-[9px] font-black uppercase text-left transition-all truncate border-l-2 rounded-none hover:border-l-white"
                                            style={{ borderLeftColor: accentColor }}
                                        >
                                            {label}
                                            <span className="block text-[7px] text-white/40 font-mono font-bold mt-0.5">
                                                {preset.duration}m | {preset.difficulty}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <form onSubmit={handleLogSession} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                {/* Session Type */}
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e] font-mono">Tipo de Actividad</label>
                                    <select
                                        value={sessionType}
                                        onChange={e => setSessionType(e.target.value as SessionCategory)}
                                        className="w-full bg-black border border-white/10 p-3 text-xs font-bold outline-none rounded-none focus:border-white/30 text-white cursor-pointer"
                                    >
                                        {/* Show He categories first if current user is El, and vice versa */}
                                        {!isElla ? (
                                            <>
                                                <option value="physical_therapy">Terapia Física</option>
                                                <option value="occupational_therapy">Terapia Ocupacional</option>
                                                <option value="mobility">Movilidad Articular</option>
                                                <option value="stretching">Estiramiento</option>
                                                <option value="recovery">Recuperación Activa</option>
                                                <option value="strength">Fuerza</option>
                                                <option value="cardio">Cardio</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="strength">Fuerza</option>
                                                <option value="cardio">Cardio</option>
                                                <option value="legs">Entrenamiento Pierna</option>
                                                <option value="core">Entrenamiento Core</option>
                                                <option value="mobility">Movilidad Dinámica</option>
                                                <option value="stretching">Estiramiento</option>
                                                <option value="recovery">Recuperación Activa</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                {/* Duration */}
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e] font-mono">Duración (Minutos)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="300"
                                        value={duration}
                                        onChange={e => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full bg-black border border-white/10 p-3 text-xs font-bold outline-none rounded-none focus:border-white/30 text-white font-mono"
                                        placeholder="Ej: 30"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Difficulty */}
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e] font-mono">Nivel de Esfuerzo</label>
                                    <div className="flex border border-white/10 rounded-none">
                                        {(['low', 'medium', 'high'] as const).map(lvl => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => setDifficulty(lvl)}
                                                className={`flex-1 py-2 text-[9px] uppercase font-black transition-all rounded-none ${
                                                    difficulty === lvl
                                                        ? 'bg-white text-black'
                                                        : 'bg-black text-[#a88a7e] hover:bg-white/5'
                                                }`}
                                            >
                                                {lvl === 'low' ? 'Baja' : lvl === 'medium' ? 'Media' : 'Alta'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Energy Level */}
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e] font-mono">Energía al iniciar</label>
                                    <div className="flex border border-white/10 rounded-none">
                                        {(['low', 'medium', 'high'] as const).map(lvl => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => setEnergyLevel(lvl)}
                                                className={`flex-1 py-2 text-[9px] uppercase font-black transition-all rounded-none ${
                                                    energyLevel === lvl
                                                        ? 'bg-white text-black'
                                                        : 'bg-black text-[#a88a7e] hover:bg-white/5'
                                                }`}
                                            >
                                                {lvl === 'low' ? 'Bajo' : lvl === 'medium' ? 'Medio' : 'Alto'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Daily Status Mode */}
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e] font-mono">Estado de la actividad</label>
                                    <select
                                        value={completionStatus}
                                        onChange={e => setCompletionStatus(e.target.value as CompletionStatus)}
                                        className="w-full bg-black border border-white/10 p-2.5 text-xs font-bold outline-none rounded-none focus:border-white/30 text-white cursor-pointer"
                                    >
                                        <option value="completed">Sesión Completada</option>
                                        <option value="recovery">Día de Recuperación</option>
                                        <option value="rest_day">Día de Descanso</option>
                                    </select>
                                </div>
                            </div>

                            {/* Therapy Specific Advanced Fields */}
                            <AnimatePresence>
                                {showTherapyFields && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden space-y-4 pt-4 border-t border-white/5 rounded-none"
                                    >
                                        <h4 className="text-[8px] font-black uppercase tracking-wider text-emerald-500 font-mono">
                                            REGISTRO ESPECIALIZADO DE TERAPIA REHABILITADORA
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase tracking-wider text-[#a88a7e] font-mono">Dolor inicial (0 al 10)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    value={painBefore}
                                                    onChange={e => setPainBefore(e.target.value === '' ? '' : Number(e.target.value))}
                                                    placeholder="Ej: 5"
                                                    className="w-full bg-black border border-white/10 p-2 text-xs font-bold outline-none rounded-none focus:border-white/30 text-white font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase tracking-wider text-[#a88a7e] font-mono">Dolor al finalizar (0 al 10)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    value={painAfter}
                                                    onChange={e => setPainAfter(e.target.value === '' ? '' : Number(e.target.value))}
                                                    placeholder="Ej: 3"
                                                    className="w-full bg-black border border-white/10 p-2 text-xs font-bold outline-none rounded-none focus:border-white/30 text-white font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase tracking-wider text-[#a88a7e] font-mono">Estado de movilidad</label>
                                                <select
                                                    value={mobilityStatus}
                                                    onChange={e => setMobilityStatus(e.target.value as MobilityStatus)}
                                                    className="w-full bg-black border border-white/10 p-2 text-xs font-bold outline-none rounded-none focus:border-white/30 text-white cursor-pointer"
                                                >
                                                    <option value="good">Adecuado</option>
                                                    <option value="normal">Esperado</option>
                                                    <option value="limited">Restringido</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase tracking-wider text-[#a88a7e] font-mono">Nivel de fatiga (1 al 5)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={fatigueLevel}
                                                    onChange={e => setFatigueLevel(e.target.value === '' ? '' : Number(e.target.value))}
                                                    placeholder="Ej: 2"
                                                    className="w-full bg-black border border-white/10 p-2 text-xs font-bold outline-none rounded-none focus:border-white/30 text-white font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase tracking-wider text-[#a88a7e] font-mono">Notas del terapeuta / Indicaciones</label>
                                                <input
                                                    type="text"
                                                    value={therapistNotes}
                                                    onChange={e => setTherapistNotes(e.target.value)}
                                                    placeholder="Pautas del fisioterapeuta..."
                                                    className="w-full bg-black border border-white/10 p-2 text-xs font-bold outline-none rounded-none focus:border-white/30 text-white font-mono"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e] font-mono">Notas u observaciones personales</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Sensaciones de la sesión, progreso o estado del cuerpo..."
                                    rows={2}
                                    className="w-full bg-black border border-white/10 p-3 text-xs font-bold outline-none rounded-none focus:border-white/30 text-white resize-none font-mono"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 text-[10px] uppercase font-black tracking-[0.25em] transition-all border mt-2 flex items-center justify-center gap-2 rounded-none font-mono"
                                style={{
                                    backgroundColor: accentColor,
                                    borderColor: accentColor,
                                    color: 'black'
                                }}
                            >
                                {isSubmitting ? 'GUARDANDO...' : 'REGISTRAR ACTIVIDAD'}
                            </button>
                        </form>
                    </div>
        </>
    );
}
