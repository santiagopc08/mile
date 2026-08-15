import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useHillClimbStore } from '../../src/stores/useHillClimbStore';

describe('useHillClimbStore', () => {
    let localStorageMock: Record<string, string> = {};
    const originalWindow = global.window;

    beforeEach(() => {
        // Mock window.localStorage behavior for our specific tests
        localStorageMock = {};

        Object.defineProperty(global, 'window', {
            value: {
                localStorage: {
                    getItem: (key: string) => localStorageMock[key] || null,
                    setItem: (key: string, value: string) => { localStorageMock[key] = value.toString(); },
                    clear: () => { localStorageMock = {}; }
                }
            },
            writable: true,
            configurable: true
        });

        // Reset the store state before each test
        useHillClimbStore.setState({
            gameState: 'MENU',
            fuel: 100,
            distance: 0,
            coins: 0,
            speed: 0,
            airTime: 0,
            rpm: 0,
            accelActive: false,
            brakeActive: false,
            highScore: 0,
            bestCoins: 0,
            deathReason: null,
            isNewRecord: false,
        });
        vi.clearAllMocks();
    });

    afterEach(() => {
         Object.defineProperty(global, 'window', {
            value: originalWindow,
            writable: true,
            configurable: true
        });
    });

    describe('Initial State', () => {
        it('initializes with default values', () => {
            const state = useHillClimbStore.getState();
            expect(state.gameState).toBe('MENU');
            expect(state.fuel).toBe(100);
            expect(state.distance).toBe(0);
            expect(state.coins).toBe(0);
            expect(state.speed).toBe(0);
            expect(state.airTime).toBe(0);
            expect(state.rpm).toBe(0);
            expect(state.accelActive).toBe(false);
            expect(state.brakeActive).toBe(false);
            expect(state.highScore).toBe(0);
            expect(state.bestCoins).toBe(0);
            expect(state.deathReason).toBeNull();
            expect(state.isNewRecord).toBe(false);
        });
    });

    describe('loadRecords', () => {
        it('loads records from localStorage correctly', () => {
            window.localStorage.setItem('hill_climb_high_score', '150');
            window.localStorage.setItem('hill_climb_best_coins', '25');

            useHillClimbStore.getState().loadRecords();

            const state = useHillClimbStore.getState();
            expect(state.highScore).toBe(150);
            expect(state.bestCoins).toBe(25);
        });

        it('handles non-existent records gracefully', () => {
            useHillClimbStore.getState().loadRecords();

            const state = useHillClimbStore.getState();
            expect(state.highScore).toBe(0);
            expect(state.bestCoins).toBe(0);
        });

        it('handles invalid records gracefully', () => {
            window.localStorage.setItem('hill_climb_high_score', 'invalid');
            window.localStorage.setItem('hill_climb_best_coins', 'invalid');

            useHillClimbStore.getState().loadRecords();

            const state = useHillClimbStore.getState();
            expect(state.highScore).toBe(0);
            expect(state.bestCoins).toBe(0);
        });
    });

    describe('setGameState', () => {
        it('updates gameState correctly', () => {
            useHillClimbStore.getState().setGameState('PLAYING');
            expect(useHillClimbStore.getState().gameState).toBe('PLAYING');

            useHillClimbStore.getState().setGameState('PAUSED');
            expect(useHillClimbStore.getState().gameState).toBe('PAUSED');
        });
    });

    describe('updateHUD', () => {
        it('updates HUD values and clamps fuel between 0 and 100', () => {
            useHillClimbStore.getState().updateHUD({
                fuel: 50,
                distance: 120,
                coins: 10,
                speed: 40,
                airTime: 2,
                rpm: 0.8,
                accelActive: true,
                brakeActive: false,
            });

            let state = useHillClimbStore.getState();
            expect(state.fuel).toBe(50);
            expect(state.distance).toBe(120);
            expect(state.coins).toBe(10);
            expect(state.speed).toBe(40);
            expect(state.airTime).toBe(2);
            expect(state.rpm).toBe(0.8);
            expect(state.accelActive).toBe(true);
            expect(state.brakeActive).toBe(false);

            // Test fuel clamping (upper bound)
            useHillClimbStore.getState().updateHUD({
                fuel: 150,
                distance: 120,
                coins: 10,
                speed: 40,
                airTime: 2,
                rpm: 0.8,
                accelActive: true,
                brakeActive: false,
            });
            state = useHillClimbStore.getState();
            expect(state.fuel).toBe(100);

            // Test fuel clamping (lower bound)
            useHillClimbStore.getState().updateHUD({
                fuel: -10,
                distance: 120,
                coins: 10,
                speed: 40,
                airTime: 2,
                rpm: 0.8,
                accelActive: true,
                brakeActive: false,
            });
            state = useHillClimbStore.getState();
            expect(state.fuel).toBe(0);
        });
    });

    describe('setGameOver', () => {
        it('sets game over state without new record', () => {
            useHillClimbStore.setState({
                distance: 50,
                coins: 5,
                highScore: 100,
                bestCoins: 10
            });

            useHillClimbStore.getState().setGameOver('Out of fuel');

            const state = useHillClimbStore.getState();
            expect(state.gameState).toBe('GAMEOVER');
            expect(state.deathReason).toBe('Out of fuel');
            expect(state.isNewRecord).toBe(false);
            expect(state.highScore).toBe(100);
            expect(state.bestCoins).toBe(10);

            expect(global.window.localStorage.getItem('hill_climb_high_score')).toBeNull();
            expect(global.window.localStorage.getItem('hill_climb_best_coins')).toBeNull();
        });

        it('sets game over state with new distance record and updates localStorage', () => {
            useHillClimbStore.setState({
                distance: 150,
                coins: 5,
                highScore: 100,
                bestCoins: 10
            });

            useHillClimbStore.getState().setGameOver('Crashed');

            const state = useHillClimbStore.getState();
            expect(state.gameState).toBe('GAMEOVER');
            expect(state.deathReason).toBe('Crashed');
            expect(state.isNewRecord).toBe(true);
            expect(state.highScore).toBe(150);
            expect(state.bestCoins).toBe(10);

            expect(global.window.localStorage.getItem('hill_climb_high_score')).toBe('150');
            expect(global.window.localStorage.getItem('hill_climb_best_coins')).toBeNull();
        });

        it('sets game over state with new coins record and updates localStorage', () => {
            useHillClimbStore.setState({
                distance: 50,
                coins: 15,
                highScore: 100,
                bestCoins: 10
            });

            useHillClimbStore.getState().setGameOver('Out of fuel');

            const state = useHillClimbStore.getState();
            expect(state.gameState).toBe('GAMEOVER');
            expect(state.deathReason).toBe('Out of fuel');
            expect(state.isNewRecord).toBe(false);
            expect(state.highScore).toBe(100);
            expect(state.bestCoins).toBe(15);

            expect(global.window.localStorage.getItem('hill_climb_high_score')).toBeNull();
            expect(global.window.localStorage.getItem('hill_climb_best_coins')).toBe('15');
        });

        it('sets game over state with both new records and updates localStorage', () => {
            useHillClimbStore.setState({
                distance: 150,
                coins: 15,
                highScore: 100,
                bestCoins: 10
            });

            useHillClimbStore.getState().setGameOver('Crashed');

            const state = useHillClimbStore.getState();
            expect(state.gameState).toBe('GAMEOVER');
            expect(state.deathReason).toBe('Crashed');
            expect(state.isNewRecord).toBe(true);
            expect(state.highScore).toBe(150);
            expect(state.bestCoins).toBe(15);

            expect(global.window.localStorage.getItem('hill_climb_high_score')).toBe('150');
            expect(global.window.localStorage.getItem('hill_climb_best_coins')).toBe('15');
        });
    });

    describe('resetGame', () => {
        it('resets the game state to PLAYING with initial values', () => {
            // First set some non-default state
            useHillClimbStore.setState({
                gameState: 'GAMEOVER',
                fuel: 50,
                distance: 100,
                coins: 10,
                speed: 20,
                airTime: 5,
                rpm: 0.5,
                accelActive: true,
                brakeActive: true,
                deathReason: 'Crashed',
                isNewRecord: true,
                // Keep these as they shouldn't reset
                highScore: 100,
                bestCoins: 10
            });

            useHillClimbStore.getState().resetGame();

            const state = useHillClimbStore.getState();
            expect(state.gameState).toBe('PLAYING');
            expect(state.fuel).toBe(100);
            expect(state.distance).toBe(0);
            expect(state.coins).toBe(0);
            expect(state.speed).toBe(0);
            expect(state.airTime).toBe(0);
            expect(state.rpm).toBe(0);
            expect(state.accelActive).toBe(false);
            expect(state.brakeActive).toBe(false);
            expect(state.deathReason).toBeNull();
            expect(state.isNewRecord).toBe(false);

            // These should remain untouched
            expect(state.highScore).toBe(100);
            expect(state.bestCoins).toBe(10);
        });
    });
});
