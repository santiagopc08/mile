import { differenceInDays, addDays, parseISO } from 'date-fns';

export type CycleEntry = {
    id: string;
    date: string;
    flow_level: 'Ninguno' | 'Bajo' | 'Medio' | 'Alto' | '';
    is_atypical: boolean;
    symptoms_enc: string;
    notes_enc: string;
};

export type BiometricState = {
    cycles: CycleEntry[];
    luteal_constant: number;
};

export const encrypt = (text: string) => btoa(encodeURIComponent(text));
export const decrypt = (hash: string) => {
    try {
        return decodeURIComponent(atob(hash));
    } catch {
        return '';
    }
};

export const FLO_SYMPTOMS = ['Cólicos', 'Hinchazón', 'Cambios de Humor', 'Fatiga', 'Ansiedad', 'Migraña'];

export const calculateEngineStats = (cycles: CycleEntry[]) => {
    if (!cycles || cycles.length === 0) return null;

    const sorted = [...cycles].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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

    // ⚡ Bolt Optimization: Cache decrypted symptoms to avoid redundant expensive decrypt calls inside nested loops
    const recentDecryptedSymptoms = recentCycles.map(c => decrypt(c.symptoms_enc));

    const frequentSymptoms = FLO_SYMPTOMS.filter(sym => {
        let count = 0;
        // ⚡ Bolt Optimization: Replace .filter().length with O(N) loop to avoid intermediate array allocations
        for (const symptomsStr of recentDecryptedSymptoms) {
            if (symptomsStr.includes(sym)) {
                count++;
                if (count >= 2) return true; // Early exit optimization
            }
        }
        return false;
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
};

export const getPartnerTranslation = (engineStats: ReturnType<typeof calculateEngineStats>) => {
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
