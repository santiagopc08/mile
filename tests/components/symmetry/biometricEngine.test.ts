import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateEngineStats, CycleEntry, encrypt } from '../../../src/components/symmetry/biometricEngine';
import { formatISO, subDays } from 'date-fns';

describe('biometricEngine', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-05-01T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns null for empty cycles', () => {
        expect(calculateEngineStats([])).toBeNull();
    });

    it('calculates stats for a single cycle', () => {
        const date = subDays(new Date('2024-05-01T12:00:00Z'), 3);
        const cycle: CycleEntry = {
            id: '1',
            date: formatISO(date),
            flow_level: 'Medio',
            is_atypical: false,
            symptoms_enc: encrypt(''),
            notes_enc: encrypt('')
        };
        const stats = calculateEngineStats([cycle]);
        expect(stats).not.toBeNull();
        expect(stats?.currentPhase).toBe('Menstrual'); // 3 days since last
        expect(stats?.predictedCycleLength).toBe(28); // Default
    });

    it('calculates weighted cycle length for multiple typical cycles', () => {
        const today = new Date('2024-05-01T12:00:00Z');
        const cycle1 = { id: '1', date: formatISO(subDays(today, 60)), flow_level: 'Medio' as const, is_atypical: false, symptoms_enc: encrypt(''), notes_enc: encrypt('') };
        const cycle2 = { id: '2', date: formatISO(subDays(today, 30)), flow_level: 'Medio' as const, is_atypical: false, symptoms_enc: encrypt(''), notes_enc: encrypt('') };
        const cycle3 = { id: '3', date: formatISO(today), flow_level: 'Medio' as const, is_atypical: false, symptoms_enc: encrypt(''), notes_enc: encrypt('') };

        // lengths are 30 and 30
        const stats = calculateEngineStats([cycle1, cycle2, cycle3]);
        expect(stats?.predictedCycleLength).toBe(30);
        expect(stats?.currentPhase).toBe('Menstrual'); // today, so 0 days since last
    });

    it('ignores atypical cycles and length > 45', () => {
        const today = new Date('2024-05-01T12:00:00Z');
        const cycle1 = { id: '1', date: formatISO(subDays(today, 90)), flow_level: 'Medio' as const, is_atypical: false, symptoms_enc: encrypt(''), notes_enc: encrypt('') };
        // atypical cycle
        const cycle2 = { id: '2', date: formatISO(subDays(today, 70)), flow_level: 'Medio' as const, is_atypical: true, symptoms_enc: encrypt(''), notes_enc: encrypt('') };
        // > 45 days length between cycle1 and cycle3 (if cycle2 was ignored)
        const cycle3 = { id: '3', date: formatISO(today), flow_level: 'Medio' as const, is_atypical: false, symptoms_enc: encrypt(''), notes_enc: encrypt('') };

        const stats = calculateEngineStats([cycle1, cycle2, cycle3]);
        expect(stats?.predictedCycleLength).toBe(28); // Default since only lengths > 45 exist among valid cycles
    });

    it('detects Lútea phase warning signals for Ansiedad', () => {
        const today = new Date('2024-05-01T12:00:00Z');
        // Setup dates to be in Lútea phase (e.g. 24 days since last cycle, assuming 28 day cycle length)
        const cycle1 = { id: '1', date: formatISO(subDays(today, 80)), flow_level: 'Medio' as const, is_atypical: false, symptoms_enc: encrypt('Ansiedad'), notes_enc: encrypt('') };
        const cycle2 = { id: '2', date: formatISO(subDays(today, 52)), flow_level: 'Medio' as const, is_atypical: false, symptoms_enc: encrypt('Ansiedad'), notes_enc: encrypt('') };
        const cycle3 = { id: '3', date: formatISO(subDays(today, 24)), flow_level: 'Medio' as const, is_atypical: false, symptoms_enc: encrypt('Ansiedad'), notes_enc: encrypt('') };

        const stats = calculateEngineStats([cycle1, cycle2, cycle3]);
        expect(stats?.currentPhase).toBe('Lútea');
        expect(stats?.frequentSymptoms).toContain('Ansiedad');
        expect(stats?.warningSignal).toContain('Ansiedad detectada como tendencia pre-menstrual.');
    });
});
