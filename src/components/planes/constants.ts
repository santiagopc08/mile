import { Utensils, Plane, Gamepad2, Cpu, Sparkles, Home } from 'lucide-react';

export const GOAL_CATEGORIES = [
    { id: 'Food', label: 'Comida', icon: Utensils, emoji: '🍕' },
    { id: 'Travel', label: 'Viajes', icon: Plane, emoji: '✈️' },
    { id: 'Gaming', label: 'Juegos', icon: Gamepad2, emoji: '🎮' },
    { id: 'Tech', label: 'Tecnología', icon: Cpu, emoji: '💻' },
    { id: 'Experiences', label: 'Experiencias', icon: Sparkles, emoji: '🎭' },
    { id: 'Home', label: 'Hogar', icon: Home, emoji: '🏠' },
] as const;

export const STATE_CONFIG = {
    DISCOVERED: { label: 'Idea', css: 'state-discovered', next: 'SAVING', nextLabel: 'Empezar a Ahorrar' },
    SAVING: { label: 'Ahorrando', css: 'state-saving', next: 'READY_TO_DEPLOY', nextLabel: '¡Completar ahorro!' },
    READY_TO_DEPLOY: { label: '¡Listos para realizar!', css: 'state-ready', next: 'COMPLETED', nextLabel: '¡Marcar Logrado!' },
    COMPLETED: { label: '¡Logrado!', css: 'state-completed', next: 'ARCHIVED', nextLabel: 'Archivar' },
    ARCHIVED: { label: 'Archivado', css: 'state-archived', next: null, nextLabel: null },
} as const;

export const REACTION_CONFIG = [
    { type: 'LIKE', emoji: '❤️', label: 'Me gusta' },
    { type: 'PRIORITY', emoji: '⚡', label: 'Destacado' },
    { type: 'WANT_THIS_WITH_YOU', emoji: '💫', label: 'Contigo' },
] as const;

export const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

export const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days}d`;
};
