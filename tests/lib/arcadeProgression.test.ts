import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    loadArcadeProgression,
    saveArcadeProgression,
    recordArcadeGameScore,
    spinArcadeGachapon,
    claimQuestReward,
    redeemCoupon,
    GACHAPON_COST,
    ArcadeProgressionState,
} from '@/lib/arcadeProgression';

const STORAGE_KEY = 'mile_arcade_progression_v1';

describe('arcadeProgression', () => {
    let mockLocalStorage: { [key: string]: string };

    const mockToday = '2023-10-15';

    beforeEach(() => {
        mockLocalStorage = {};

        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                mockLocalStorage[key] = value;
            }),
            clear: vi.fn(() => { mockLocalStorage = {}; }),
        });

        vi.stubGlobal('window', {
            dispatchEvent: vi.fn(),
        });

        // Mock Date to get predictable daily quests
        const date = new Date(`${mockToday}T00:00:00Z`);
        vi.useFakeTimers();
        vi.setSystemTime(date);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    describe('loadArcadeProgression', () => {
        it('should return default state and generate quests if local storage is empty', () => {
            const state = loadArcadeProgression();
            expect(state.coins).toBe(150);
            expect(state.synergyXP).toBe(0);
            expect(state.dailyQuests.length).toBeGreaterThan(0); expect(state.dailyQuests.length).toBeLessThanOrEqual(4);
            expect(state.lastQuestDate).toBe(mockToday);

            // Should be saved immediately
            expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(state));
        });

        it('should load existing state from local storage', () => {
            const existingState: ArcadeProgressionState = {
                coins: 500,
                synergyXP: 100,
                totalGamesPlayed: 5,
                scores: {},
                coupons: [],
                redeemedCoupons: [],
                dailyQuests: [
                    { id: 'q1', title: 'Q1', description: 'desc', gameId: 'g1', target: 100, current: 0, completed: false, claimed: false, rewardCoins: 10 }
                ],
                lastQuestDate: mockToday,
            };
            mockLocalStorage[STORAGE_KEY] = JSON.stringify(existingState);

            const state = loadArcadeProgression();
            expect(state.coins).toBe(500);
            expect(state.dailyQuests.length).toBe(1);
        });

        it('should refresh daily quests if date changed', () => {
            const existingState: ArcadeProgressionState = {
                coins: 500,
                synergyXP: 100,
                totalGamesPlayed: 5,
                scores: {},
                coupons: [],
                redeemedCoupons: [],
                dailyQuests: [
                    { id: 'q1', title: 'Q1', description: 'desc', gameId: 'g1', target: 100, current: 0, completed: false, claimed: false, rewardCoins: 10 }
                ],
                lastQuestDate: '2023-10-14', // Old date
            };
            mockLocalStorage[STORAGE_KEY] = JSON.stringify(existingState);

            const state = loadArcadeProgression();
            // Should have newly generated quests
            expect(state.dailyQuests.length).toBeGreaterThan(0); expect(state.dailyQuests.length).toBeLessThanOrEqual(4);
            expect(state.lastQuestDate).toBe(mockToday);
        });
    });

    describe('saveArcadeProgression', () => {
        it('should save state to localStorage and broadcast event by default', async () => {
            const state = loadArcadeProgression();
            state.coins = 200;
            saveArcadeProgression(state);

            expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(state));

            // Process microtasks
            await Promise.resolve();
            expect(window.dispatchEvent).toHaveBeenCalled();
        });

        it('should not broadcast event if broadcast is false', async () => {
            const state = loadArcadeProgression();
            saveArcadeProgression(state, false);

            await Promise.resolve();
            // It might have been called on load, so we just check it wasn't called AGAIN
            // To be precise, let's clear the mock first.
            vi.mocked(window.dispatchEvent).mockClear();
            saveArcadeProgression(state, false);
            await Promise.resolve();
            expect(window.dispatchEvent).not.toHaveBeenCalled();
        });
    });

    describe('recordArcadeGameScore', () => {
        beforeEach(() => {
            // Initialize with some quests
            loadArcadeProgression();
        });

        it('should record first score and set new records', () => {
            const result = recordArcadeGameScore('brickstorm', 100, 'ella');

            expect(result.isNewPersonalBest).toBe(true);
            expect(result.isNewCoupleRecord).toBe(true);

            const state = JSON.parse(mockLocalStorage[STORAGE_KEY]);
            expect(state.scores['brickstorm'].ella).toBe(100);
            expect(state.totalGamesPlayed).toBe(1);
            expect(state.synergyXP).toBe(100);
            expect(result.leadProfile).toBe('ella');
        });

        it('should calculate coins correctly', () => {
            // 250 / 25 = 10 base coins. New personal (25) + New couple (50) = 85 coins.
            const result = recordArcadeGameScore('brickstorm', 250, 'el');
            expect(result.coinsEarned).toBe(85);

            const state = JSON.parse(mockLocalStorage[STORAGE_KEY]);
            // Initial 150 + 85 = 235
            expect(state.coins).toBe(235);
        });

        it('should not grant new couple record if score is lower than other player', () => {
            recordArcadeGameScore('brickstorm', 500, 'el'); // El gets 500

            const result = recordArcadeGameScore('brickstorm', 300, 'ella'); // Ella gets 300
            expect(result.isNewPersonalBest).toBe(true);
            expect(result.isNewCoupleRecord).toBe(false); // 300 < 500
            expect(result.leadProfile).toBe('el');
        });

        it('should update quest progress', () => {
            const state = loadArcadeProgression();
            // Find a quest and force it to be for the game we play
            const quest = state.dailyQuests[0];
            quest.gameId = 'testgame';
            quest.target = 500;
            saveArcadeProgression(state);

            const result = recordArcadeGameScore('testgame', 200, 'el');
            expect(result.questsCompleted.length).toBe(0);

            const stateAfter = loadArcadeProgression();
            expect(stateAfter.dailyQuests[0].current).toBe(200);
            expect(stateAfter.dailyQuests[0].completed).toBe(false);

            // Play again to complete
            const result2 = recordArcadeGameScore('testgame', 400, 'el');
            expect(result2.questsCompleted.length).toBe(1);
            expect(result2.questsCompleted[0].id).toBe(quest.id);

            const finalState = loadArcadeProgression();
            expect(finalState.dailyQuests[0].current).toBe(500); // capped at target
            expect(finalState.dailyQuests[0].completed).toBe(true);
        });
    });

    describe('spinArcadeGachapon', () => {
        it('should return error if not enough coins', () => {
            const state = loadArcadeProgression();
            state.coins = 50; // Less than GACHAPON_COST
            saveArcadeProgression(state);

            const result = spinArcadeGachapon();
            expect(result.success).toBe(false);
            expect(result.error).toContain('Necesitas');
        });

        it('should deduct coins and return a coupon on success', () => {
            const state = loadArcadeProgression();
            state.coins = GACHAPON_COST + 100;
            saveArcadeProgression(state);

            const result = spinArcadeGachapon();
            expect(result.success).toBe(true);
            expect(result.coupon).toBeDefined();

            const finalState = loadArcadeProgression();
            expect(finalState.coins).toBe(100);
            expect(finalState.coupons.length).toBe(1);
        });
    });

    describe('claimQuestReward', () => {
        it('should return false if quest not found or not completed', () => {
            const result = claimQuestReward('non-existent');
            expect(result).toBe(false);
        });

        it('should grant coins and mark claimed when valid', () => {
            const state = loadArcadeProgression();
            const quest = state.dailyQuests[0];
            quest.completed = true;
            quest.claimed = false;
            quest.rewardCoins = 50;
            const initialCoins = state.coins;
            saveArcadeProgression(state);

            const result = claimQuestReward(quest.id);
            expect(result).toBe(true);

            const finalState = loadArcadeProgression();
            expect(finalState.dailyQuests[0].claimed).toBe(true);
            expect(finalState.coins).toBe(initialCoins + 50);
        });

        it('should not allow claiming twice', () => {
            const state = loadArcadeProgression();
            const quest = state.dailyQuests[0];
            quest.completed = true;
            quest.claimed = true;
            saveArcadeProgression(state);

            const result = claimQuestReward(quest.id);
            expect(result).toBe(false);
        });
    });

    describe('redeemCoupon', () => {
        it('should return false if coupon not found', () => {
            const result = redeemCoupon('non-existent', 'el');
            expect(result).toBe(false);
        });

        it('should move coupon from coupons to redeemedCoupons', () => {
            const state = loadArcadeProgression();
            const coupon = {
                id: 'test_coupon',
                title: 'Test',
                description: 'Test',
                emoji: '😀',
                category: 'fun' as const,
                rarity: 'common' as const,
                color: '#000',
                unlockedAt: '2023-10-15',
            };
            state.coupons.push(coupon);
            saveArcadeProgression(state);

            const result = redeemCoupon('test_coupon', 'ella');
            expect(result).toBe(true);

            const finalState = loadArcadeProgression();
            expect(finalState.coupons.length).toBe(0);
            expect(finalState.redeemedCoupons.length).toBe(1);
            expect(finalState.redeemedCoupons[0].id).toBe('test_coupon');
            expect(finalState.redeemedCoupons[0].redeemedBy).toBe('ella');
            expect(finalState.redeemedCoupons[0].redeemedAt).toBeDefined();
        });
    });
});
