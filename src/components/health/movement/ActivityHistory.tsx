import React from 'react';
import { Clock, Shield, Trash2, Heart, Compass, Activity, Smile, Dumbbell, Zap, HelpCircle } from 'lucide-react';
import { MovementSession, SessionCategory, ReactionType } from './types';
import { BrutalistSkeleton } from '@/components/ui/BrutalistSkeleton';

import { ActivitySessionItem } from "./ActivitySessionItem";
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
    loading: boolean;
    handleDeleteSession: (id: string) => Promise<void>;
    handleAddReaction: (id: string, type: ReactionType) => Promise<void>;
    REACTION_CONFIG: Record<ReactionType, { label: string; emoji: string; color: string }> | Record<string, { label: string; emoji: string; color: string }>;
}

export function ActivityHistory({
    sessions,
    profile,
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
                                {sessions.slice(0, 25).map(session => (
                                        <ActivitySessionItem key={session.id} session={session} profile={profile} handleDeleteSession={handleDeleteSession} handleAddReaction={handleAddReaction} REACTION_CONFIG={REACTION_CONFIG} reactionKeys={reactionKeys} />
                                ))}
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
