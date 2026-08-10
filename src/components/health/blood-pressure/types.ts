export const POSITION_LABELS = {
    sitting: 'SENTADO',
    'edge of bed': 'BORDE CAMA',
    lied: 'ACOSTADO'
} as const;

export interface BloodPressureEntry {
    id: string;
    systolic: number;
    diastolic: number;
    heart_rate: number;
    position: keyof typeof POSITION_LABELS;
    author: string;
    created_at: string;
}
