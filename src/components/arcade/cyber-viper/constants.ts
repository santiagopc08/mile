import { CoupleSnack } from './types';

export const COLS = 40;
export const ROWS = 24;
export const CELL_SIZE = 26;
export const V_WIDTH = COLS * CELL_SIZE; // 1040
export const V_HEIGHT = ROWS * CELL_SIZE; // 624

export const COUPLE_SNACKS: CoupleSnack[] = [
    { name: 'Sushi de Salmón', emoji: '🍣', type: 'standard', points: 100, color: '#ff7043' },
    { name: 'Matcha Latte', emoji: '🍵', type: 'standard', points: 120, color: '#4caf50' },
    { name: 'Boba Tea', emoji: '🧋', type: 'multiplier', points: 200, color: '#a855f7' },
    { name: 'Pizza de Pareja', emoji: '🍕', type: 'golden', points: 300, color: '#facc15' },
    { name: 'Fresas con Crema', emoji: '🍓', type: 'speed', points: 150, color: '#ec4899' },
    { name: 'Helado Artesanal', emoji: '🍦', type: 'standard', points: 110, color: '#38bdf8' },
    { name: 'Hamburguesa Smash', emoji: '🍔', type: 'golden', points: 350, color: '#f59e0b' },
    { name: 'Cafecito Especial', emoji: '☕', type: 'speed', points: 150, color: '#d97706' },
];
