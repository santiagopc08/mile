import { Heart, Compass, Activity, Smile, Dumbbell, Zap, Shield } from 'lucide-react';
import { SessionCategory, ReactionType, MovementSession } from './types';

export const CATEGORY_LABELS: Record<SessionCategory, { label: string; icon: any; isTherapy: boolean }> = {
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

export const REACTION_CONFIG: Record<ReactionType, { label: string; emoji: string; color: string }> = {
    GOOD_JOB: { label: 'BUEN TRABAJO', emoji: '👍', color: '#c3f400' },
    KEEP_GOING: { label: 'SIGUE ASÍ', emoji: '🔥', color: '#ffb1c3' },
    RECOVERY_DAY: { label: 'DÍA DE DESCANSO', emoji: '🍃', color: '#d1bcff' },
    PROUD_OF_YOU: { label: 'ORGULLOSO DE TI', emoji: '💫', color: '#ff4b89' }
};

export const PRESETS_EL: Omit<MovementSession, 'id' | 'profile' | 'date' | 'reactions' | 'created_at'>[] = [
    {
        session_type: 'physical_therapy',
        duration: 30,
        difficulty: 'medium',
        energy_level: 'medium',
        completion_status: 'completed',
        pain_before: 5,
        pain_after: 3,
        fatigue_level: 3,
        mobility_status: 'normal',
        notes: 'Ejercicios de estabilidad y control de cadera/rodilla.',
        therapist_notes: 'Enfoque en alineación patelar y propiocepción.'
    },
    {
        session_type: 'occupational_therapy',
        duration: 25,
        difficulty: 'medium',
        energy_level: 'high',
        completion_status: 'completed',
        pain_before: 4,
        pain_after: 2,
        fatigue_level: 2,
        mobility_status: 'normal',
        notes: 'Ejercicios de motricidad fina y fortalecimiento de agarre.',
        therapist_notes: 'Trabajo de pinzas y pinza lateral.'
    },
    {
        session_type: 'mobility',
        duration: 15,
        difficulty: 'low',
        energy_level: 'medium',
        completion_status: 'completed',
        notes: 'Rutina de movilidad articular de columna y hombros.'
    },
    {
        session_type: 'recovery',
        duration: 20,
        difficulty: 'low',
        energy_level: 'low',
        completion_status: 'recovery',
        notes: 'Liberación miofascial y respiración profunda en colchoneta.'
    }
];

export const PRESETS_ELLA: Omit<MovementSession, 'id' | 'profile' | 'date' | 'reactions' | 'created_at'>[] = [
    {
        session_type: 'strength',
        duration: 45,
        difficulty: 'high',
        energy_level: 'high',
        completion_status: 'completed',
        notes: 'Entrenamiento de empuje/tracción tren superior.'
    },
    {
        session_type: 'cardio',
        duration: 30,
        difficulty: 'high',
        energy_level: 'medium',
        completion_status: 'completed',
        notes: 'Intervalos en bicicleta estática + saltos.'
    },
    {
        session_type: 'legs',
        duration: 40,
        difficulty: 'medium',
        energy_level: 'high',
        completion_status: 'completed',
        notes: 'Sentadillas, zancadas e isquiotibiales con peso moderado.'
    },
    {
        session_type: 'mobility',
        duration: 20,
        difficulty: 'low',
        energy_level: 'medium',
        completion_status: 'completed',
        notes: 'Movilidad de cadera y flexibilidad de flexores.'
    }
];
