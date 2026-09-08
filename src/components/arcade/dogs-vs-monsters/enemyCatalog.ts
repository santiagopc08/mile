import { EnemyId } from './types';

export interface EnemyTemplate {
    type: EnemyId;
    name: string;
    hp: number;
    speed: number; // pixels per second
    damage: number; // damage per attack bite
    attackInterval: number; // seconds per bite
    color: string;
    accent: string;
    icon: string;
    description: string;
    armorHp?: number;
}

export const ENEMY_CATALOG: Record<EnemyId, EnemyTemplate> = {
    cat_scout: {
        type: 'cat_scout',
        name: 'Gato Travieso',
        hp: 180,
        speed: 18,
        damage: 40,
        attackInterval: 1.0,
        color: '#f97316',
        accent: '#fdba74',
        icon: '😼',
        description: 'Invasor callejero estándar. Camina en línea recta arañando las defensas.',
    },
    cat_box: {
        type: 'cat_box',
        name: 'Gato Acorazado con Caja',
        hp: 180,
        armorHp: 400,
        speed: 16,
        damage: 45,
        attackInterval: 1.0,
        color: '#d97706',
        accent: '#fbbf24',
        icon: '📦',
        description: 'Lleva una caja de cartón blindada que absorbe 400 HP de daño antes de caer.',
    },
    cat_ninja: {
        type: 'cat_ninja',
        name: 'Gato Ninja Acróbata',
        hp: 240,
        speed: 38,
        damage: 50,
        attackInterval: 0.9,
        color: '#6366f1',
        accent: '#a5b4fc',
        icon: '🥷',
        description: 'Corre a gran velocidad y realiza una voltereta saltando por encima del primer perrito.',
    },
    vacuum_monster: {
        type: 'vacuum_monster',
        name: 'Aspiradora Monstruosa 🌪️',
        hp: 2200,
        speed: 8,
        damage: 90,
        attackInterval: 1.2,
        color: '#64748b',
        accent: '#94a3b8',
        icon: '🌪️',
        description: 'El mayor temor canino. Avanza rugiendo con motor eléctrico y absorbe proyectiles frontales.',
    },
    bath_groomer: {
        type: 'bath_groomer',
        name: 'Bañador con Champú 🚿',
        hp: 1200,
        speed: 12,
        damage: 60,
        attackInterval: 1.1,
        color: '#06b6d4',
        accent: '#67e8f9',
        icon: '🚿',
        description: 'Lanza burbujas de jabón que atrapan temporalmente a los perritos en burbujas flotantes.',
    },
    squirrel_nut: {
        type: 'squirrel_nut',
        name: 'Ardilla Acróbata',
        hp: 200,
        speed: 28,
        damage: 35,
        attackInterval: 0.8,
        color: '#a16207',
        accent: '#ca8a04',
        icon: '🐿️',
        description: 'Se desplaza en zigzag y lanza bellotas a distancia hacia las mascotas.',
    },
    boss_mecha_cat: {
        type: 'boss_mecha_cat',
        name: 'Robot Gato Colosal 🤖',
        hp: 6500,
        speed: 6,
        damage: 150,
        attackInterval: 1.5,
        color: '#ec4899',
        accent: '#f43f5e',
        icon: '🤖',
        description: 'Jefe colosal mecanizado. Despliega ratones mecánicos y activa rayos láser de puntero rojo.',
    },
};
