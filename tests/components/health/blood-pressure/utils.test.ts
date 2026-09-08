import { describe, it, expect } from 'vitest';
import { getPressureCategory } from '@/components/health/blood-pressure/utils';

describe('getPressureCategory', () => {
    it('returns null for invalid inputs', () => {
        expect(getPressureCategory('', '')).toBeNull();
        expect(getPressureCategory(120, '')).toBeNull();
        expect(getPressureCategory('', 80)).toBeNull();
        expect(getPressureCategory(0, 0)).toBeNull();
        expect(getPressureCategory(-10, 80)).toBeNull();
        expect(getPressureCategory(120, -10)).toBeNull();
        expect(getPressureCategory('120' as any, '80' as any)).toBeNull();
    });

    it('identifies CRISIS HIPERTENSIVA correctly', () => {
        expect(getPressureCategory(181, 80)?.label).toBe('CRISIS HIPERTENSIVA');
        expect(getPressureCategory(120, 121)?.label).toBe('CRISIS HIPERTENSIVA');
        expect(getPressureCategory(181, 121)?.label).toBe('CRISIS HIPERTENSIVA');
    });

    it('identifies HIPERTENSIÓN ETAPA 2 correctly', () => {
        expect(getPressureCategory(140, 85)?.label).toBe('HIPERTENSIÓN ETAPA 2');
        expect(getPressureCategory(160, 85)?.label).toBe('HIPERTENSIÓN ETAPA 2');
        expect(getPressureCategory(120, 90)?.label).toBe('HIPERTENSIÓN ETAPA 2');
        expect(getPressureCategory(120, 119)?.label).toBe('HIPERTENSIÓN ETAPA 2');
    });

    it('identifies HIPERTENSIÓN ETAPA 1 correctly', () => {
        expect(getPressureCategory(130, 75)?.label).toBe('HIPERTENSIÓN ETAPA 1');
        expect(getPressureCategory(139, 75)?.label).toBe('HIPERTENSIÓN ETAPA 1');
        expect(getPressureCategory(110, 80)?.label).toBe('HIPERTENSIÓN ETAPA 1');
        expect(getPressureCategory(110, 89)?.label).toBe('HIPERTENSIÓN ETAPA 1');
    });

    it('identifies PRESIÓN ELEVADA correctly', () => {
        expect(getPressureCategory(120, 79)?.label).toBe('PRESIÓN ELEVADA');
        expect(getPressureCategory(129, 75)?.label).toBe('PRESIÓN ELEVADA');
    });

    it('identifies HIPOTENSIÓN (BAJA) correctly', () => {
        expect(getPressureCategory(89, 70)?.label).toBe('HIPOTENSIÓN (BAJA)');
        expect(getPressureCategory(110, 59)?.label).toBe('HIPOTENSIÓN (BAJA)');
        expect(getPressureCategory(80, 50)?.label).toBe('HIPOTENSIÓN (BAJA)');
    });

    it('identifies PRESIÓN ÓPTIMA / NORMAL correctly', () => {
        expect(getPressureCategory(119, 79)?.label).toBe('PRESIÓN ÓPTIMA / NORMAL');
        expect(getPressureCategory(90, 60)?.label).toBe('PRESIÓN ÓPTIMA / NORMAL');
        expect(getPressureCategory(110, 70)?.label).toBe('PRESIÓN ÓPTIMA / NORMAL');
    });
});
