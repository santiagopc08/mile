import { create } from 'zustand';

export type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER' | 'PAUSED';

const HIGH_SCORE_KEY = 'hill_climb_high_score';
const BEST_COINS_KEY = 'hill_climb_best_coins';

interface HillClimbStore {
    gameState: GameState;
    fuel: number;
    distance: number;
    coins: number;
    speed: number;          // km/h ficticios, sólo para el HUD
    airTime: number;
    rpm: number;            // Régimen del motor normalizado 0-1
    accelActive: boolean;   // Pedal derecho pisado (teclado o táctil)
    brakeActive: boolean;   // Pedal izquierdo pisado
    highScore: number;
    bestCoins: number;
    deathReason: string | null;
    isNewRecord: boolean;

    loadRecords: () => void;
    setGameState: (state: GameState) => void;
    updateHUD: (data: {
        fuel: number; distance: number; coins: number; speed: number;
        airTime: number; rpm: number; accelActive: boolean; brakeActive: boolean;
    }) => void;
    setGameOver: (reason: string) => void;
    resetGame: () => void;
}

/** Lectura de localStorage tolerante a fallos (modo privado, cuota, SSR). */
function readNumber(key: string): number {
    if (typeof window === 'undefined') return 0;
    try {
        return parseInt(window.localStorage.getItem(key) || '0', 10) || 0;
    } catch {
        return 0;
    }
}

function writeNumber(key: string, value: number) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, String(value));
    } catch {
        /* almacenamiento no disponible: el récord sólo dura la sesión */
    }
}

export const useHillClimbStore = create<HillClimbStore>((set, get) => ({
    gameState: 'MENU',
    fuel: 100,
    distance: 0,
    coins: 0,
    speed: 0,
    airTime: 0,
    rpm: 0,
    accelActive: false,
    brakeActive: false,
    // Se inicializa a 0 y se rellena en loadRecords() desde el cliente, para no
    // tocar localStorage durante la evaluación del módulo.
    highScore: 0,
    bestCoins: 0,
    deathReason: null,
    isNewRecord: false,

    loadRecords: () =>
        set({
            highScore: readNumber(HIGH_SCORE_KEY),
            bestCoins: readNumber(BEST_COINS_KEY),
        }),

    setGameState: (state) => set({ gameState: state }),

    updateHUD: ({ fuel, distance, coins, speed, airTime, rpm, accelActive, brakeActive }) =>
        set({
            fuel: Math.max(0, Math.min(100, fuel)),
            distance,
            coins,
            speed,
            airTime,
            rpm,
            accelActive,
            brakeActive,
        }),

    // El récord se consolida al terminar la partida, no en cada frame
    setGameOver: (reason) => {
        const { distance, coins, highScore, bestCoins } = get();
        const isNewRecord = distance > highScore;

        if (isNewRecord) writeNumber(HIGH_SCORE_KEY, distance);
        if (coins > bestCoins) writeNumber(BEST_COINS_KEY, coins);

        set({
            gameState: 'GAMEOVER',
            deathReason: reason,
            isNewRecord,
            highScore: Math.max(highScore, distance),
            bestCoins: Math.max(bestCoins, coins),
        });
    },

    resetGame: () =>
        set({
            gameState: 'PLAYING',
            fuel: 100,
            distance: 0,
            coins: 0,
            speed: 0,
            airTime: 0,
            rpm: 0,
            accelActive: false,
            brakeActive: false,
            deathReason: null,
            isNewRecord: false,
        }),
}));
