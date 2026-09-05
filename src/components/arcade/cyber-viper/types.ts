import { StylizedMemory } from '@/hooks/useArcadePhotos';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type FoodType = 'standard' | 'golden' | 'speed' | 'multiplier';

export interface CoupleSnack {
    name: string;
    emoji: string;
    type: FoodType;
    points: number;
    color: string;
}

export interface Segment {
    x: number;
    y: number;
}

export interface Food {
    x: number;
    y: number;
    snack: CoupleSnack;
    pulse: number;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    life: number;
    maxLife: number;
    alpha: number;
}

export interface FloatingText {
    x: number;
    y: number;
    text: string;
    color: string;
    life: number;
}

export interface HoloFlash {
    memory: StylizedMemory;
    timer: number;
    maxTimer: number;
}
