import { useState, useRef, useEffect, useCallback } from 'react';

export function useFireStreak() {
    const [streakCombo, setStreakCombo] = useState(0);
    const [streakTimeRemaining, setStreakTimeRemaining] = useState(0);
    const [comboSign, setComboSign] = useState<{ id: number; text: string; combo: number } | null>(null);
    const [comboShake, setComboShake] = useState(false);
    const [maxGameCombo, setMaxGameCombo] = useState(0);

    const streakTimerRef = useRef<NodeJS.Timeout | null>(null);
    const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const comboShakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (streakCombo === 0 || streakTimeRemaining <= 0) return;

        streakTimerRef.current = setTimeout(() => {
            setStreakTimeRemaining(prev => {
                if (prev <= 1) {
                    setStreakCombo(0);
                    setComboSign(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (streakTimerRef.current) clearTimeout(streakTimerRef.current);
        };
    }, [streakCombo, streakTimeRemaining]);

    const triggerStreakCombo = useCallback((newCombo: number) => {
        setStreakCombo(newCombo);
        setMaxGameCombo(prev => Math.max(prev, newCombo));

        const duration = 5;
        setStreakTimeRemaining(duration);

        let comboText = "";
        if (newCombo === 1) {
            comboText = "¡CHISPA ENCENDIDA!";
        } else if (newCombo === 2) {
            comboText = "¡BRASA ARDIENTE!";
        } else if (newCombo === 3) {
            comboText = "¡LLAMA ALTA!";
        } else if (newCombo === 4) {
            comboText = "¡LLAMARADA TOTAL!";
        } else if (newCombo === 5) {
            comboText = "¡TABLERO EN LLAMAS!";
        } else {
            comboText = `¡COMBO x${newCombo}!`;
        }

        if (comboTimeoutRef.current) {
            clearTimeout(comboTimeoutRef.current);
        }
        setComboSign({ id: Date.now(), text: comboText, combo: newCombo });
        comboTimeoutRef.current = setTimeout(() => {
            setComboSign(null);
        }, 1600);

        if (newCombo >= 3) {
            setComboShake(false);
            if (comboShakeTimeoutRef.current) clearTimeout(comboShakeTimeoutRef.current);
            requestAnimationFrame(() => setComboShake(true));
            comboShakeTimeoutRef.current = setTimeout(() => setComboShake(false), 420);
        }
    }, []);

    const resetFireStreak = useCallback(() => {
        setStreakCombo(0);
        setComboSign(null);
        setComboShake(false);
        setMaxGameCombo(0);
        if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
        if (streakTimerRef.current) clearTimeout(streakTimerRef.current);
        if (comboShakeTimeoutRef.current) clearTimeout(comboShakeTimeoutRef.current);
    }, []);

    return {
        streakCombo,
        streakTimeRemaining,
        comboSign,
        comboShake,
        maxGameCombo,
        triggerStreakCombo,
        resetFireStreak
    };
}
