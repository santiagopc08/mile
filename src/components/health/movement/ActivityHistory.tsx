import React from 'react';
import { Clock, Shield, Trash2, Heart, Compass, Activity, Smile, Dumbbell, Zap, HelpCircle } from 'lucide-react';
import { MovementSession, SessionCategory, ReactionType } from './types';
import { BrutalistSkeleton } from '@/components/ui/BrutalistSkeleton';

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

interface ActivityHistoryProps {
    sessions: MovementSession[];
    profile: string;
    isElla: boolean;
    loading: boolean;
    handleDeleteSession: (id: string) => Promise<void>;
    handleAddReaction: (id: string, type: any) => Promise<void>;
    REACTION_CONFIG: Record<string, { label: string; emoji: string; color: string }>;
}

export function ActivityHistory({
    sessions,
    profile,
    isElla,
    loading,
    handleDeleteSession,
    handleAddReaction,
    REACTION_CONFIG
}: ActivityHistoryProps) {
    // ⚡ Bolt Optimization: Pre-calculate Object keys to avoid O(N) evaluations in render map loops
    const reactionKeys = Object.keys(REACTION_CONFIG) as ReactionType[];

    return (
        <>
                    {/* CAPA 3: HISTORIAL & ACTIVIDAD RECIENTE */}
                    <div className="border border-white/10 bg-black p-5 relative rounded-none">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30" />

                        <h3 className="text-[10px] uppercase font-black tracking-[0.25em] text-[#a88a7e] mb-4 pb-2 border-b border-white/5 font-mono">
                            Historial de Actividad
                        </h3>

                        {loading ? (
                            <BrutalistSkeleton label="Cargando registros" className="h-24 w-full" />
                        ) : sessions.length === 0 ? (
                            <div className="py-12 border border-dashed border-white/10 text-center text-xs text-white/20 font-mono">
                                No hay sesiones registradas en la base de datos.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                                {sessions.slice(0, 25).map(session => {
                                    const isSelf = session.profile === profile;
                                    const accent = session.profile === 'ella' ? '#ff4b89' : '#c3f400';
                                    const accentTextClass = session.profile === 'ella' ? 'text-user-a' : 'text-user-b';
                                    const catConfig = CATEGORY_LABELS[session.session_type];
                                    const IconComponent = catConfig ? catConfig.icon : HelpCircle;

                                    return (
                                        <div
                                            key={session.id}
                                            className="p-4 pl-8 border border-white/5 bg-[#070707] hover:border-white/10 transition-all space-y-3 relative group rounded-none"
                                        >
                                            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: accent }} />

                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex items-start gap-2.5">
                                                    <div className="p-1.5 border border-white/10 bg-black text-white mt-0.5 rounded-none">
                                                        <IconComponent className="w-3.5 h-3.5 stroke-[1.5]" style={{ color: accent }} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-white font-mono">
                                                                {catConfig ? catConfig.label : session.session_type}
                                                            </span>
                                                            <span className={`text-[7px] font-black uppercase tracking-widest font-mono ${accentTextClass}`}>
                                                                {session.profile === 'ella' ? 'Ella' : 'Él'}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 sm:flex sm:items-center sm:gap-3 text-[7px] text-white/30 font-bold mt-1 font-mono uppercase">
                                                            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5 stroke-[1.5]" /> {session.duration} MIN</span>
                                                            <span>DIF: {session.difficulty}</span>
                                                            <span className="col-span-2 sm:col-span-1">ENERGÍA: {session.energy_level}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions / Delete */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-mono text-white/30 tabular-nums">
                                                        {session.date}
                                                    </span>
                                                    {isSelf && (
                                                        <button
                                                            onClick={() => handleDeleteSession(session.id)}
                                                            className="text-stone-700 hover:text-red-500 transition-colors p-1 rounded-none"
                                                            title="Eliminar sesión"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Note / Description */}
                                            {session.notes && (
                                                <p className="text-[9px] text-[#e1bfb2] leading-relaxed pl-1.5 border-l border-white/10 italic font-mono">
                                                    "{session.notes}"
                                                </p>
                                            )}

                                            {/* Advanced clinical parameters (For rehabilitation focus) */}
                                            {catConfig?.isTherapy && (session.pain_before !== undefined || session.therapist_notes) && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border border-emerald-955 bg-emerald-955/5 text-[8px] font-bold text-[#a88a7e] uppercase tracking-wider pl-2 rounded-none font-mono">
                                                    {session.pain_before !== undefined && (
                                                        <div>
                                                            <span className="text-white/40 block text-[6px]">EVOLUCIÓN DEL DOLOR:</span>
                                                            <span className="text-white">DOLOR: {session.pain_before}/10 → <span className="text-emerald-400 font-black">{session.pain_after}/10</span></span>
                                                        </div>
                                                    )}
                                                    {session.therapist_notes && (
                                                        <div>
                                                            <span className="text-white/40 block text-[6px]">PAUTAS REHABILITADORAS:</span>
                                                            <span className="text-white font-normal italic">"{session.therapist_notes}"</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Mutual Support reactions list */}
                                            {session.reactions && session.reactions.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-1 pl-1.5 font-mono">
                                                    {session.reactions.map((rx, idx) => {
                                                        const rxConfig = REACTION_CONFIG[rx.type];
                                                        return (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-0.5 border border-white/10 bg-black/40 text-[7px] font-black uppercase tracking-wider flex items-center gap-1 text-white/80 rounded-none"
                                                                style={{ borderLeftColor: rxConfig?.color || 'white' }}
                                                            >
                                                                <span>{rxConfig?.emoji}</span>
                                                                <span>{rx.reactor === 'el' ? 'Él' : 'Ella'}:</span>
                                                                <span style={{ color: rxConfig?.color }}>{rxConfig?.label}</span>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Reaction Support Trigger Buttons (Allow logging reaction for partner) */}
                                            {!isSelf && (
                                                <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-white/5 font-mono">
                                                    <span className="text-[7px] font-black tracking-widest text-[#a88a7e] uppercase block w-full mb-1">
                                                        ANIMA A TU PAREJA:
                                                    </span>
                                                    {(() => {
                                                        // ⚡ Bolt Optimization: Use a Set to make `alreadyReacted` lookups O(1) instead of nested .some()
                                                        const myReactionsSet = new Set<string>();
                                                        if (session.reactions) {
                                                            for (const r of session.reactions) {
                                                                if (r.reactor === profile) myReactionsSet.add(r.type);
                                                            }
                                                        }

                                                        return reactionKeys.map(rxType => {
                                                            const rxConfig = REACTION_CONFIG[rxType];
                                                            const alreadyReacted = myReactionsSet.has(rxType);

                                                            return (
                                                                <button
                                                                    key={rxType}
                                                                    onClick={() => handleAddReaction(session.id, rxType)}
                                                                    className={`px-2 py-1 text-[7px] font-black uppercase tracking-wider border transition-all flex items-center gap-1 rounded-none ${
                                                                        alreadyReacted
                                                                            ? 'bg-white text-black border-white'
                                                                            : 'bg-black hover:bg-white/5 border-white/10 text-white/50 hover:text-white'
                                                                    }`}
                                                                >
                                                                    <span>{rxConfig.emoji}</span>
                                                                    <span>{rxConfig.label}</span>
                                                                </button>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

            {/* Custom gradients for layout glow effects */}
            <svg width="0" height="0" className="absolute pointer-events-none">
                <defs>
                    <linearGradient id="syncGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c3f400" />
                        <stop offset="100%" stopColor="#ff4b89" />
                    </linearGradient>
                </defs>
            </svg>
        </>
    );
}
