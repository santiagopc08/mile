import { Pizza, Coffee, Bike, CreditCard } from 'lucide-react';
import type { HealthHabitType } from '@/services/storeService';

export const HABIT_CONFIG: Record<HealthHabitType, { label: string; icon: typeof Pizza; color: string }> = {
    junk_food: { label: 'Comida Chatarra', icon: Pizza, color: '#ffb595' },
    snacks: { label: 'Snacks / Antojos', icon: Coffee, color: '#e5b5ff' },
    delivery: { label: 'Domicilios', icon: Bike, color: '#00dbe9' },
    impulse_spending: { label: 'Gasto Impulsivo', icon: CreditCard, color: '#ff003c' },
};

export const copFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export const formatCOP = (val: number) => copFormatter.format(val);
