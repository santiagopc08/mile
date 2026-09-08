'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    loadArcadeProgression,
    ArcadeProgressionState,
    recordArcadeGameScore,
    spinArcadeGachapon,
    claimQuestReward,
    redeemCoupon,
    ScoreRecordResult,
    ArcadeCoupon,
    GACHAPON_COST,
} from '@/lib/arcadeProgression';
import { useProfile } from '@/context/ProfileContext';

export function useArcadeProgression() {
    const { profile } = useProfile();
    const [progression, setProgression] = useState<ArcadeProgressionState>(loadArcadeProgression);

    const refresh = useCallback(() => {
        setProgression(loadArcadeProgression());
    }, []);

    useEffect(() => {
        refresh();

        const handleUpdate = (e: Event) => {
            const custom = e as CustomEvent<ArcadeProgressionState>;
            if (custom.detail) {
                setProgression(custom.detail);
            } else {
                refresh();
            }
        };

        window.addEventListener('mile_arcade_progression_changed', handleUpdate);
        window.addEventListener('storage', handleUpdate);

        return () => {
            window.removeEventListener('mile_arcade_progression_changed', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
        };
    }, [refresh]);

    const recordScore = useCallback(
        (gameId: string, score: number): ScoreRecordResult => {
            const res = recordArcadeGameScore(gameId, score, profile);
            refresh();
            return res;
        },
        [profile, refresh]
    );

    const spin = useCallback(() => {
        const res = spinArcadeGachapon();
        refresh();
        return res;
    }, [refresh]);

    const claimQuest = useCallback(
        (questId: string) => {
            const success = claimQuestReward(questId);
            refresh();
            return success;
        },
        [refresh]
    );

    const redeem = useCallback(
        (couponId: string) => {
            const success = redeemCoupon(couponId, profile);
            refresh();
            return success;
        },
        [profile, refresh]
    );

    const pendingQuestsCount = progression.dailyQuests.filter(q => q.completed && !q.claimed).length;

    return {
        progression,
        coins: progression.coins,
        synergyXP: progression.synergyXP,
        totalGamesPlayed: progression.totalGamesPlayed,
        scores: progression.scores,
        coupons: progression.coupons,
        redeemedCoupons: progression.redeemedCoupons,
        dailyQuests: progression.dailyQuests,
        pendingQuestsCount,
        gachaponCost: GACHAPON_COST,
        recordScore,
        spin,
        claimQuest,
        redeem,
        refresh,
    };
}
