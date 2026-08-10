export const getPressureCategory = (sys: number | '', dia: number | '') => {
    if (typeof sys !== 'number' || typeof dia !== 'number' || sys <= 0 || dia <= 0) return null;

    if (sys > 180 || dia > 120) {
        return {
            label: 'CRISIS HIPERTENSIVA',
            color: '#f43f5e',
            bg: 'bg-rose-950/40 text-rose-300 border-rose-500/40',
            badge: 'CRISIS',
            icon: '🚨',
        };
    }
    if (sys >= 140 || dia >= 90) {
        return {
            label: 'HIPERTENSIÓN ETAPA 2',
            color: '#fb7185',
            bg: 'bg-rose-950/30 text-rose-300 border-rose-500/30',
            badge: 'ETAPA 2',
            icon: '⚠️',
        };
    }
    if (sys >= 130 || dia >= 80) {
        return {
            label: 'HIPERTENSIÓN ETAPA 1',
            color: '#f97316',
            bg: 'bg-amber-950/30 text-amber-300 border-amber-500/30',
            badge: 'ETAPA 1',
            icon: '⚡',
        };
    }
    if (sys >= 120 && dia < 80) {
        return {
            label: 'PRESIÓN ELEVADA',
            color: '#f59e0b',
            bg: 'bg-amber-950/20 text-amber-200 border-amber-500/20',
            badge: 'ELEVADA',
            icon: '📈',
        };
    }
    if (sys < 90 || dia < 60) {
        return {
            label: 'HIPOTENSIÓN (BAJA)',
            color: '#38bdf8',
            bg: 'bg-sky-950/30 text-sky-300 border-sky-500/30',
            badge: 'BAJA',
            icon: '📉',
        };
    }
    return {
        label: 'PRESIÓN ÓPTIMA / NORMAL',
        color: '#10b981',
        bg: 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30',
        badge: 'ÓPTIMA',
        icon: '✓',
    };
};
