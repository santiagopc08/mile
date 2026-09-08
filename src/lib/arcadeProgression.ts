'use client';

import { Profile } from '@/context/ProfileContext';

export interface GameScoreRecord {
    el: number;
    ella: number;
    lastUpdated?: string;
}

export interface ArcadeCoupon {
    id: string;
    title: string;
    description: string;
    emoji: string;
    category: 'romance' | 'relax' | 'food' | 'chores' | 'fun';
    rarity: 'common' | 'rare' | 'legendary';
    color: string;
    unlockedAt: string;
    redeemedAt?: string;
    redeemedBy?: Profile;
}

export interface DailyQuest {
    id: string;
    title: string;
    description: string;
    gameId: string;
    target: number;
    current: number;
    rewardCoins: number;
    completed: boolean;
    claimed: boolean;
}

export interface ArcadeProgressionState {
    coins: number;
    synergyXP: number;
    totalGamesPlayed: number;
    scores: Record<string, GameScoreRecord>;
    coupons: ArcadeCoupon[];
    redeemedCoupons: ArcadeCoupon[];
    dailyQuests: DailyQuest[];
    lastQuestDate: string;
}

const STORAGE_KEY = 'mile_arcade_progression_v1';

export const GACHAPON_COST = 250; // Coins to spin the Gachapon capsule

export const COUPON_CATALOG = [
    {
        id: 'c_masaje_20',
        title: 'Vale por Masaje de 20 Minutos',
        description: 'Masaje relajante en cuello, hombros o espalda a la carta sin derecho a queja.',
        emoji: '💆‍♂️',
        category: 'relax' as const,
        rarity: 'rare' as const,
        color: '#ff4b89',
    },
    {
        id: 'c_pelicula_eleccion',
        title: 'Elección Absoluta de Película / Serie',
        description: 'El poseedor de este cupón decide qué vemos hoy sin derecho a veto ni quejas.',
        emoji: '🎬',
        category: 'fun' as const,
        rarity: 'common' as const,
        color: '#00f0ff',
    },
    {
        id: 'c_cena_sorpresa',
        title: 'Cena o Postre Especial Invitado',
        description: 'El otro cocina o pide el delivery del antojo favorito del ganador.',
        emoji: '🍕',
        category: 'food' as const,
        rarity: 'rare' as const,
        color: '#f59e0b',
    },
    {
        id: 'c_platos_inmunidad',
        title: 'Inmunidad Total de Lavar Platos',
        description: 'Pase libre para no fregar platos ni ordenar la cocina durante 24 horas.',
        emoji: '🧼',
        category: 'chores' as const,
        rarity: 'common' as const,
        color: '#10b981',
    },
    {
        id: 'c_desayuno_cama',
        title: 'Desayuno en la Cama con Café',
        description: 'Despertar con café caliente, tostadas o fruta servidos directamente en cama.',
        emoji: '☕',
        category: 'food' as const,
        rarity: 'rare' as const,
        color: '#eab308',
    },
    {
        id: 'c_besos_infinitos',
        title: 'Racha de 50 Besos Instantáneos',
        description: 'Canjeable en cualquier momento, lugar o situación sin excusa.',
        emoji: '💋',
        category: 'romance' as const,
        rarity: 'common' as const,
        color: '#ec4899',
    },
    {
        id: 'c_cita_espontanea',
        title: 'Pase de Cita Espontánea / Aventura',
        description: 'Salida express a caminar, por un helado o a descubrir un lugar nuevo.',
        emoji: '✨',
        category: 'romance' as const,
        rarity: 'legendary' as const,
        color: '#a855f7',
    },
    {
        id: 'c_musica_auto',
        title: 'DJ Oficial del Auto / Parlante',
        description: 'Control total de la playlist durante todo el viaje o la tarde.',
        emoji: '🎵',
        category: 'fun' as const,
        rarity: 'common' as const,
        color: '#06b6d4',
    },
    {
        id: 'c_comodín_deseo',
        title: 'Comodín de Amor Universal',
        description: 'Un deseo razonable a cumplir por tu pareja cuando más lo necesites.',
        emoji: '👑',
        category: 'romance' as const,
        rarity: 'legendary' as const,
        color: '#ffd700',
    },
];

function getTodayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generateDailyQuests(dateStr: string): DailyQuest[] {
    const dayNum = dateStr.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);

    const questPool: Omit<DailyQuest, 'current' | 'completed' | 'claimed'>[] = [
        {
            id: `q_brick_${dateStr}`,
            title: 'Maestro Rompe-Bloques',
            description: 'Acumula 1,500 puntos en Brick Storm revelando recuerdos.',
            gameId: 'brickstorm',
            target: 1500,
            rewardCoins: 120,
        },
        {
            id: `q_viper_${dateStr}`,
            title: 'Banquete Cibernético',
            description: 'Consigue 300 puntos en Cyber Viper devorando delicias.',
            gameId: 'cyberviper',
            target: 300,
            rewardCoins: 100,
        },
        {
            id: `q_supp_${dateStr}`,
            title: 'Sintonía de Rompecabezas',
            description: 'Logra 1,000 puntos en Supplement Shooter completando rectángulos.',
            gameId: 'supplementshooter',
            target: 1000,
            rewardCoins: 150,
        },
        {
            id: `q_turbo_${dateStr}`,
            title: 'Pilotos en Fuga',
            description: 'Alcanza 500 metros en Turbo Race sin chocar.',
            gameId: 'turborace',
            target: 500,
            rewardCoins: 100,
        },
        {
            id: `q_smash_${dateStr}`,
            title: 'Demolición Total 3D',
            description: 'Destruye 15 bloques en Smash Fest 3D.',
            gameId: 'smashfest',
            target: 15,
            rewardCoins: 120,
        },
        {
            id: `q_mahjong_${dateStr}`,
            title: 'Vínculo de Pareja 3D',
            description: 'Empareja 10 fichas en Miel-Jong 3D.',
            gameId: 'mahjong',
            target: 10,
            rewardCoins: 140,
        },
    ];

    // Pick 4 rotating quests deterministically per day
    const quests: DailyQuest[] = [];
    for (let i = 0; i < 4; i++) {
        const idx = (dayNum + i * 2) % questPool.length;
        const q = questPool[idx];
        if (!quests.some(existing => existing.id === q.id)) {
            quests.push({
                ...q,
                current: 0,
                completed: false,
                claimed: false,
            });
        }
    }

    return quests;
}

const DEFAULT_STATE: ArcadeProgressionState = {
    coins: 150,
    synergyXP: 0,
    totalGamesPlayed: 0,
    scores: {},
    coupons: [],
    redeemedCoupons: [],
    dailyQuests: [],
    lastQuestDate: '',
};

export function loadArcadeProgression(): ArcadeProgressionState {
    if (typeof window === 'undefined') return DEFAULT_STATE;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        let state: ArcadeProgressionState = raw ? JSON.parse(raw) : { ...DEFAULT_STATE };

        const today = getTodayString();
        if (state.lastQuestDate !== today || !state.dailyQuests || state.dailyQuests.length === 0) {
            state.dailyQuests = generateDailyQuests(today);
            state.lastQuestDate = today;
            // Silently persist initial daily quests without triggering broadcast during render
            saveArcadeProgression(state, false);
        }

        return state;
    } catch {
        return DEFAULT_STATE;
    }
}

export function saveArcadeProgression(state: ArcadeProgressionState, broadcast: boolean = true): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        if (broadcast) {
            // Defer dispatch to avoid synchronous setState calls while other components are rendering
            queueMicrotask(() => {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('mile_arcade_progression_changed', { detail: state }));
                }
            });
        }
    } catch (e) {
        console.error('Error saving arcade progression:', e);
    }
}

export interface ScoreRecordResult {
    isNewPersonalBest: boolean;
    isNewCoupleRecord: boolean;
    coinsEarned: number;
    xpEarned: number;
    questsCompleted: DailyQuest[];
    leadProfile: 'el' | 'ella' | 'tie';
}

/**
 * Records a game score for the active player, updates records, grants coins/XP,
 * and updates daily quest progress.
 */
export function recordArcadeGameScore(
    gameId: string,
    score: number,
    profile: Profile
): ScoreRecordResult {
    const state = loadArcadeProgression();
    const activeUser = profile === 'ella' ? 'ella' : 'el';

    const currentRecord = state.scores[gameId] || { el: 0, ella: 0 };
    const prevPersonalBest = currentRecord[activeUser] || 0;
    const prevCoupleHigh = Math.max(currentRecord.el || 0, currentRecord.ella || 0);

    const isNewPersonalBest = score > prevPersonalBest;
    const isNewCoupleRecord = score > prevCoupleHigh;

    // Update player score if higher
    if (score > prevPersonalBest) {
        currentRecord[activeUser] = score;
        currentRecord.lastUpdated = new Date().toISOString();
        state.scores[gameId] = currentRecord;
    }

    // Award Coins & XP
    // 1 coin per 25 points scored (min 5, max 100 per game)
    const baseCoins = Math.min(100, Math.max(5, Math.floor(score / 25)));
    const bonusCoins = (isNewPersonalBest ? 25 : 0) + (isNewCoupleRecord ? 50 : 0);
    const totalCoinsEarned = baseCoins + bonusCoins;

    state.coins += totalCoinsEarned;
    state.synergyXP += score;
    state.totalGamesPlayed += 1;

    // Check Daily Quests
    const completedQuests: DailyQuest[] = [];
    state.dailyQuests = state.dailyQuests.map(q => {
        if (q.gameId === gameId && !q.completed) {
            const nextVal = Math.min(q.target, q.current + score);
            const isDone = nextVal >= q.target;
            if (isDone && !q.completed) {
                completedQuests.push({ ...q, current: nextVal, completed: true });
            }
            return { ...q, current: nextVal, completed: isDone };
        }
        return q;
    });

    saveArcadeProgression(state);

    const newEl = state.scores[gameId]?.el || 0;
    const newElla = state.scores[gameId]?.ella || 0;
    const leadProfile = newEl > newElla ? 'el' : newElla > newEl ? 'ella' : 'tie';

    return {
        isNewPersonalBest,
        isNewCoupleRecord,
        coinsEarned: totalCoinsEarned,
        xpEarned: score,
        questsCompleted: completedQuests,
        leadProfile,
    };
}

/**
 * Spins the Gachapon capsule machine by spending coins to obtain a couple coupon!
 */
export function spinArcadeGachapon(): { success: boolean; coupon?: ArcadeCoupon; error?: string } {
    const state = loadArcadeProgression();

    if (state.coins < GACHAPON_COST) {
        return { success: false, error: `Necesitas ${GACHAPON_COST} monedas para girar el Gachapon.` };
    }

    state.coins -= GACHAPON_COST;

    // Weighted random selection
    const rand = Math.random();
    let rarityFilter: 'common' | 'rare' | 'legendary' = 'common';
    if (rand > 0.85) rarityFilter = 'legendary';
    else if (rand > 0.50) rarityFilter = 'rare';

    const eligible = COUPON_CATALOG.filter(c => c.rarity === rarityFilter);
    const chosenTemplate = eligible.length > 0
        ? eligible[Math.floor(Math.random() * eligible.length)]
        : COUPON_CATALOG[Math.floor(Math.random() * COUPON_CATALOG.length)];

    const newCoupon: ArcadeCoupon = {
        ...chosenTemplate,
        id: `${chosenTemplate.id}_${Date.now()}`,
        unlockedAt: new Date().toISOString(),
    };

    state.coupons.push(newCoupon);
    saveArcadeProgression(state);

    return { success: true, coupon: newCoupon };
}

/**
 * Claim rewards for a finished daily quest
 */
export function claimQuestReward(questId: string): boolean {
    const state = loadArcadeProgression();
    const quest = state.dailyQuests.find(q => q.id === questId);

    if (quest && quest.completed && !qClaimed(quest)) {
        quest.claimed = true;
        state.coins += quest.rewardCoins;
        saveArcadeProgression(state);
        return true;
    }
    return false;
}

function qClaimed(q: DailyQuest): boolean {
    return !!q.claimed;
}

/**
 * Redeems an unlocked love coupon in real life
 */
export function redeemCoupon(couponId: string, profile: Profile): boolean {
    const state = loadArcadeProgression();
    const idx = state.coupons.findIndex(c => c.id === couponId);

    if (idx !== -1) {
        const [coupon] = state.coupons.splice(idx, 1);
        coupon.redeemedAt = new Date().toISOString();
        coupon.redeemedBy = profile;
        state.redeemedCoupons.unshift(coupon);
        saveArcadeProgression(state);
        return true;
    }
    return false;
}
