'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase as defaultSupabase } from '@/lib/supabase';
import { MahjongService } from '@/services/mahjongService';
import { NotificationService } from '@/services/notificationService';
import { useProfile } from '@/context/ProfileContext';
import { Undo2, Trophy, RotateCcw, Lightbulb, Sparkles, Flame, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import * as MahjongAudio from '@/lib/mahjongAudio';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';
import { Brutalist3DButton } from '@/components/ui/Brutalist3DButton';
import { BrutalistPanel, BrutalistCorners } from '@/components/ui/BrutalistPanel';
import MahjongTimer, { MahjongTimerHandle } from './MahjongTimer';
import { TileState, TileContent } from './MahjongTile';
import { MahjongCanvas } from './MahjongCanvas';
import { ComboFireFrame } from './ComboFireFrame';
import {
    getUnlockedMechanics,
    selectActiveMechanicsForGame,
    applyHardeningToBoard,
    getGhostSolidIds,
    tickBombs,
    processIceOnMatch,
    processLockUnlock,
    clearSmoke,
    triggerNewSmokeBomb,
    applyGravityCollapse,
    HardeningMechanic
} from './hardeningEngine';

import {
    getLocalDateString,
    TILESETS,
    getUnlockedTilesForCount,
    getTargetTilesForLevel,
    LAYOUT_INFO,
    filterCoordsByColumns,
    generateCoordinates,
    shuffleArray,
    getComboTier,
    generateSolvableBoard,
} from '@/lib/mahjong/logic';
import type { LayoutType, LeaderboardEntry } from '@/lib/mahjong/logic';
import { DrawingCanvasModal } from '@/components/mahjong/DrawingCanvasModal';
import { RevealDrawingModal } from '@/components/mahjong/RevealDrawingModal';
import { useDailyStats } from '@/components/mahjong/useDailyStats';
import { useBottleMessages } from '@/components/mahjong/useBottleMessages';
import { useDrawings } from '@/components/mahjong/useDrawings';
import { GameModeTabs } from "./mahjong/GameModeTabs";
import { HeaderStatus } from "./mahjong/HeaderStatus";
import { HardeningBadges } from "./mahjong/HardeningBadges";

import { useToast } from '@/components/ui/Toast';
import { useFireStreak } from './mahjong/hooks/useFireStreak';
import { ComboSign } from './mahjong/ComboSign';


import { MemoryUnlockedModal } from './mahjong/ui/MemoryUnlockedModal';
import { GameLostModal } from './mahjong/ui/GameLostModal';
import { GameWonModal } from './mahjong/ui/GameWonModal';
import { BottleMessageModal } from './mahjong/ui/BottleMessageModal';
import { DailyStatsModal } from './mahjong/ui/DailyStatsModal';
import { CoopSetupModal, CoopTurnModal } from './mahjong/ui/CoopModals';
import { MahjongHud } from './mahjong/ui/MahjongHud';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' });

export function Mahjong() {
    const { profile } = useProfile();
    // Renombrados: dentro del componente ya hay variables locales `success`.
    const { success: notifySuccess, error: notifyError, warning: notifyWarning } = useToast();
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
    const secondaryColor = profile === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';
    const secondaryClass = profile === 'ella' ? 'user-b' : 'user-a';

    const [tiles, setTiles] = useState<TileState[]>([]);
    const [currentLayout, setCurrentLayout] = useState<LayoutType>(() => {
        const layouts: LayoutType[] = ['turtle', 'fortress', 'peaks', 'random'];
        return layouts[Math.floor(Math.random() * layouts.length)];
    });
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [matchedCount, setMatchedCount] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [initialDeal, setInitialDeal] = useState<TileState[] | null>(null);

    const timerRef = useRef<MahjongTimerHandle>(null);
    const [dockIds, setDockIds] = useState<string[]>([]);
    const [gameLost, setGameLost] = useState(false);
    const [lostReason, setLostReason] = useState<'dock' | 'bomb' | null>(null);
    const [isReturningFlipped, setIsReturningFlipped] = useState(false);
    const [maxGameCombo, setMaxGameCombo] = useState(0);
    const [undoStack, setUndoStack] = useState<string[][]>([]);
    const [timerActive, setTimerActive] = useState(false);
    const [leaderboard, setLeaderboard] = useState<{ el: LeaderboardEntry[]; ella: LeaderboardEntry[] }>({ el: [], ella: [] });
    const [scoreSaved, setScoreSaved] = useState(false);
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [isMatchPulse, setIsMatchPulse] = useState(false);
    const [progressParticles, setProgressParticles] = useState<{ id: number; angle: number; speed: number; rotate: number }[]>([]);
    const [completedGamesCount, setCompletedGamesCount] = useState(0);

    const [muted, setMutedState] = useState(false);

    const {
        streakCombo,
        streakTimeRemaining,
        comboSign,
        comboShake,
        maxGameCombo: hookMaxGameCombo,
        triggerStreakCombo,
        resetFireStreak
    } = useFireStreak();

    useEffect(() => {
        setMaxGameCombo(prev => Math.max(prev, hookMaxGameCombo));
    }, [hookMaxGameCombo]);

    // Sincronizar clase de pantalla completa en body/html para ocultar AppNav en móviles
    useEffect(() => {
        if (typeof document === 'undefined') return;
        if (hasStarted) {
            document.body.classList.add('mahjong-fullscreen-active');
            document.documentElement.classList.add('mahjong-fullscreen-active');
        } else {
            document.body.classList.remove('mahjong-fullscreen-active');
            document.documentElement.classList.remove('mahjong-fullscreen-active');
        }

        return () => {
            document.body.classList.remove('mahjong-fullscreen-active');
            document.documentElement.classList.remove('mahjong-fullscreen-active');
        };
    }, [hasStarted]);

    // ─── Hardening Mechanics State ───────────────────────────────────────────
    const [ghostSolidIds, setGhostSolidIds] = useState<Set<string>>(new Set());
    const ghostElapsedRef = useRef(0);
    const bombTickRef = useRef<NodeJS.Timeout | null>(null);
    const ghostTickRef = useRef<NodeJS.Timeout | null>(null);
    const smokeTimerRef = useRef<NodeJS.Timeout | null>(null);
    const matchCountSinceSmoke = useRef(0);

    const activeTileset = useMemo(() => {
        let activeKey = 'traditional';
        let maxMin = -1;
        for (const key in TILESETS) {
            if (TILESETS[key].minGames <= completedGamesCount && TILESETS[key].minGames > maxMin) {
                maxMin = TILESETS[key].minGames;
                activeKey = key;
            }
        }
        return TILESETS[activeKey];
    }, [completedGamesCount]);

    // Cooperative play and interactive features states
    const [gameMode, setGameMode] = useState<'solo' | 'coop' | 'daily'>('solo');
    const [activeCoopGame, setActiveCoopGame] = useState<any | null>(null);
    const [coopTurn, setCoopTurn] = useState<'el' | 'ella'>('el');
    const [dailyUnlockedMemory, setDailyUnlockedMemory] = useState<{ title: string; description: string; imageUrl: string; date: string } | null>(null);

    // Mensajes en la botella (escribir / revelar) — encapsulado en useBottleMessages
    const {
        videoRef,
        hasPausedForMessage,
        setHasPausedForMessage,
        bottleNoteText,
        setBottleNoteText,
        bottleNoteModal,
        setBottleNoteModal,
        revealedBottleMessage,
        setRevealedBottleMessage,
        showMessageText,
        setShowMessageText,
        pendingReceivedBottle,
        setPendingReceivedBottle,
        todayRevealedBottle,
        setTodayRevealedBottle,
        refreshBottleMessages,
    } = useBottleMessages(profile);

    // Connection Features states (Daily stats)
    const [allScores, setAllScores] = useState<any[]>([]);
    const [partnerCompletedGames, setPartnerCompletedGames] = useState(0);
    const level = 1 + Math.floor(completedGamesCount / 15);
    const partnerLevel = 1 + Math.floor(partnerCompletedGames / 15);

    const [activeMechanics, setActiveMechanics] = useState<HardeningMechanic[]>([]);

    // Ghost phase timer — toggles every 5 seconds
    useEffect(() => {
        if (!activeMechanics.includes('ghost') || !timerActive) {
            if (ghostTickRef.current) clearInterval(ghostTickRef.current);
            return;
        }

        ghostTickRef.current = setInterval(() => {
            ghostElapsedRef.current += 1;
            setGhostSolidIds(getGhostSolidIds(tiles, ghostElapsedRef.current));
        }, 1000);

        return () => {
            if (ghostTickRef.current) clearInterval(ghostTickRef.current);
        };
    }, [activeMechanics, timerActive, tiles]);

    // Bomb countdown timer — decrements every second
    useEffect(() => {
        const hasBombs = activeMechanics.includes('bomb') && tiles.some(t => t.isBomb && !t.isMatched && (t.bombTimer ?? 0) > 0);
        if (!hasBombs || !timerActive) {
            if (bombTickRef.current) clearInterval(bombTickRef.current);
            return;
        }

        bombTickRef.current = setInterval(() => {
            setTiles(prev => {
                const { exploded, updatedTiles } = tickBombs(prev);
                if (exploded) {
                    setGameLost(true);
                    setLostReason('bomb');
                    setTimerActive(false);
                    resetFireStreak();
                    MahjongAudio.playError();
                    if (bombTickRef.current) clearInterval(bombTickRef.current);
                }
                return updatedTiles;
            });
        }, 1000);

        return () => {
            if (bombTickRef.current) clearInterval(bombTickRef.current);
        };
    }, [activeMechanics, timerActive, tiles]);

    const {
        dailyPlayRecord,
        setDailyPlayRecord,
        dailyStats,
        historicDailyStats,
        refreshDailyStats,
    } = useDailyStats(profile);
    // Dibujos de amor diarios (dibujar / revelar) — encapsulado en useDrawings
    const {
        todaySentDrawing,
        todayReceivedDrawing,
        drawingModalOpen,
        setDrawingModalOpen,
        revealDrawingModalOpen,
        setRevealDrawingModalOpen,
        revealedDrawingData,
        setRevealedDrawingData,
        refreshDrawings,
    } = useDrawings(profile);

    // Subscribe to active coop game changes
    useEffect(() => {
        if (gameMode !== 'coop' || !activeCoopGame) return;

        const channel = defaultSupabase
            .channel(`coop-game-${activeCoopGame.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'coop_games',
                    filter: `id=eq.${activeCoopGame.id}`
                },
                (payload: any) => {
                    const newGame = payload.new;
                    if (newGame) {
                        setTiles(newGame.tiles);
                        setDockIds(newGame.dock_ids || []);
                        setCoopTurn(newGame.active_turn);

                        // Recalculate matched count
                        // ⚡ Bolt Optimization: Prevent O(N) intermediate array allocation when counting matched tiles
                        let matched = 0;
                        for (let i = 0; i < newGame.tiles.length; i++) {
                            if (newGame.tiles[i].isMatched) matched++;
                        }
                        setMatchedCount(matched);

                        if (newGame.completed_at) {
                            setTimerActive(false);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            defaultSupabase.removeChannel(channel);
        };
    }, [gameMode, activeCoopGame]);

    useEffect(() => {
        if (matchedCount > 0) {
            setIsMatchPulse(true);
            const t = setTimeout(() => setIsMatchPulse(false), 400);

            // Spawn 16 wall-breaking fragments (was 10)
            // ⚡ Bolt Optimization: Use a loop instead of Array.from({ length: N }).map() to prevent memory allocation overhead
            const newParticles: {id: number; angle: number; speed: number; rotate: number}[] = [];
            for (let i = 0; i < 16; i++) {
                newParticles.push({
                    id: Date.now() + i + Math.random(),
                    angle: (Math.random() - 0.5) * Math.PI * 0.95,
                    speed: 25 + Math.random() * 55, // Faster speed
                    rotate: Math.random() * 720
                });
            }
            setProgressParticles(prev => [...prev, ...newParticles]);
            const timer = setTimeout(() => {
                // ⚡ Bolt Optimization: Use a Set to avoid O(N*M) nested array inclusion checks
                const idSet = new Set(newParticles.map(p => p.id));
                setProgressParticles(prev => prev.filter(p => !idSet.has(p.id)));
            }, 700);

            return () => {
                clearTimeout(t);
                clearTimeout(timer);
            };
        }
    }, [matchedCount]);

    const refreshConnectionFeatures = async () => {
        if (!profile) return;

        // 1. Fetch bottle messages (encapsulado en useBottleMessages)
        await refreshBottleMessages();

        // 2. Fetch daily play status & stats (encapsulado en useDailyStats)
        await refreshDailyStats();

        // 3. Fetch today's drawings (encapsulado en useDrawings)
        await refreshDrawings();
    };

    const handleStartDailyGame = async () => {
        requestGameFullscreen();
        if (!profile) return;
        const dateStr = getLocalDateString();
        const success = await MahjongService.startDailyPuzzle(profile as 'el' | 'ella', dateStr);
        if (success) {
            setDailyPlayRecord({ status: 'started' });
            setIsLoaded(false); // Triggers generation
        } else {
            notifyError('No se pudo iniciar el juego. Puede que ya lo hayas intentado hoy.', 'Desafío diario');
        }
    };

    const handleCloseWriteModal = () => {
        setBottleNoteModal(false);
        setBottleNoteText('');
        if (!gameLost && matchedCount < tiles.length) {
            setTimerActive(true);
        }
    };

    useEffect(() => {
        refreshConnectionFeatures();
    }, [profile, gameMode]);

    const isProcessingRef = useRef(false);

    const [memoryModalData, setMemoryModalData] = useState<{
        imageUrl: string;
        title: string;
        description: string;
        date: string;
    } | null>(null);

    const [eventDetailsMap, setEventDetailsMap] = useState<Map<string, { title: string; description: string; date: string }>>(new Map());

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Cargar la preferencia de silencio del audio al montar
    useEffect(() => {
        setMutedState(MahjongAudio.loadMutedPreference());
    }, []);

    const toggleMute = useCallback(() => {
        MahjongAudio.initAudio();
        const next = !MahjongAudio.isMuted();
        MahjongAudio.setMuted(next);
        setMutedState(next);
    }, []);

    useEffect(() => {
        MahjongService.getMahjongLeaderboard().then(setLeaderboard).catch(() => { });
        if (profile) {
            MahjongService.getTotalGamesCompletedCount(profile as 'el' | 'ella')
                .then(setCompletedGamesCount)
                .catch(() => { });

            const partnerProfile = profile === 'el' ? 'ella' : 'el';
            MahjongService.getTotalGamesCompletedCount(partnerProfile)
                .then(setPartnerCompletedGames)
                .catch(() => { });

            MahjongService.getAllMahjongScores()
                .then(setAllScores)
                .catch(() => { });
        }
    }, [profile]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (matchedCount === tiles.length && tiles.length > 0 && timerActive) {
            setTimerActive(false);
            resetFireStreak();
            MahjongAudio.playVictory();
            const time = timerRef.current?.getTime() || 0;

            if (gameMode === 'coop' && activeCoopGame) {
                MahjongService.completeCoopGame(activeCoopGame.id).then(() => {
                    if (profile) {
                        MahjongService.getTotalGamesCompletedCount(profile as 'el' | 'ella')
                            .then(setCompletedGamesCount)
                            .catch(() => { });
                    }
                });
                // Send co-op game won notification
                const target = profile === 'el' ? 'ella' : 'el';
                const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                NotificationService.addNotification(
                    target,
                    'mahjong_coop_won',
                    `¡Despejamos el tablero!: ${authorName} completó el tablero cooperativo. ¡Trabajo en equipo! 💖`
                ).catch(e => console.error(e));
            } else if (gameMode === 'daily') {
                const dateStr = getLocalDateString();
                MahjongService.updateDailyPuzzleStatus(profile as 'el' | 'ella', dateStr, 'completed', time)
                    .then(() => {
                        refreshConnectionFeatures();
                        if (profile) {
                            MahjongService.getTotalGamesCompletedCount(profile as 'el' | 'ella')
                                .then(setCompletedGamesCount)
                                .catch(() => { });
                        }
                    });

                // ALSO save to mahjong_scores as 'daily' layout for leaderboard
                const pKey = profile as 'el' | 'ella';
                const bestScores = leaderboard[pKey] || [];
                const isRecord = bestScores.length === 0 || time < bestScores[0].time_seconds;
                setIsNewRecord(isRecord);

                if (profile && !scoreSaved) {
                    setScoreSaved(true);
                    MahjongService.saveMahjongScore(
                        profile as 'el' | 'ella',
                        time,
                        'daily',
                        tiles.length,
                        maxGameCombo
                    ).then(() => {
                        MahjongService.getMahjongLeaderboard().then(setLeaderboard).catch(() => { });
                        if (isRecord) {
                            const target = profile === 'el' ? 'ella' : 'el';
                            const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                            NotificationService.addNotification(target, 'mahjong_record', `¡Récord Superado!: ${authorName} batió el récord en el Desafío Diario con un tiempo de ${formatTime(time)}! 🏆`).catch(e => console.error(e));
                        }
                    });
                }

                // Send daily puzzle completion notification
                const target = profile === 'el' ? 'ella' : 'el';
                const senderName = profile === 'el' ? 'Santiago' : 'Milena';
                NotificationService.addNotification(
                    target,
                    'daily_completed',
                    `¡${senderName} completó el Desafío Diario en ${formatTime(time)}! 🧠`
                ).catch(e => console.error(e));
            } else {
                const pKey = profile as 'el' | 'ella';

                // ⚡ Bolt Optimization: Calculate best time in single O(N) pass instead of multiple intermediate map/filter arrays
                let bestTimeForLevel: number | null = null;
                for (const score of allScores) {
                    if (score.layout === 'daily' || score.profile !== pKey) continue;

                    let parsedLevel = 1;
                    if (score.layout && score.layout.includes(':')) {
                        parsedLevel = parseInt(score.layout.split(':')[1], 10) || 1;
                    } else {
                        parsedLevel = score.tile_count === 96 ? 3 : score.tile_count === 88 ? 2 : 1;
                    }

                    if (parsedLevel === level) {
                        if (bestTimeForLevel === null || score.time_seconds < bestTimeForLevel) {
                            bestTimeForLevel = score.time_seconds;
                        }
                    }
                }

                const isRecord = bestTimeForLevel === null || time < bestTimeForLevel;
                setIsNewRecord(isRecord);

                if (profile && !scoreSaved) {
                    setScoreSaved(true);
                    MahjongService.saveMahjongScore(
                        profile as 'el' | 'ella',
                        time,
                        `${currentLayout}:${level}`,
                        tiles.length,
                        maxGameCombo
                    ).then(() => {
                        MahjongService.getAllMahjongScores().then(setAllScores).catch(() => { });
                        MahjongService.getTotalGamesCompletedCount(profile as 'el' | 'ella')
                            .then(setCompletedGamesCount)
                            .catch(() => { });

                        // Notify partner if record at this level
                        if (isRecord) {
                            const target = profile === 'el' ? 'ella' : 'el';
                            const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                            NotificationService.addNotification(target, 'mahjong_record', `¡Nuevo Récord de Nivel!: ${authorName} superó su marca en el Nivel ${level} con un tiempo de ${formatTime(time)}! 🏆`).catch(e => console.error(e));
                        }
                    });
                }
            }
        }
    }, [matchedCount, tiles.length, timerActive, profile, scoreSaved, currentLayout, leaderboard, gameMode, activeCoopGame, level, allScores, maxGameCombo]);

    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // ⚡ Bolt Optimization: Calculate board bounds in a single O(N) pass instead of multiple map+Math.max loops
    const { boardSpanX, boardSpanY, centerX } = useMemo(() => {
        if (tiles.length === 0) {
            return { boardSpanX: 18, boardSpanY: 14, centerX: 9 };
        }

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (const t of tiles) {
            if (t.x < minX) minX = t.x;
            if (t.x > maxX) maxX = t.x;
            if (t.y < minY) minY = t.y;
            if (t.y > maxY) maxY = t.y;
        }

        return {
            boardSpanX: maxX - minX,
            boardSpanY: maxY - minY,
            centerX: (minX + maxX) / 2
        };
    }, [tiles]);

    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.clientWidth;
            const spacingX = isMobile ? 1.5 : 2.0;
            const tileWidth = isMobile ? 3.2 : 3.5;
            const boardWidthRem = boardSpanX * spacingX + tileWidth;
            const boardWidthPx = boardWidthRem * 16;

            if (boardWidthPx > containerWidth) {
                setScale((containerWidth - 10) / boardWidthPx);
            } else {
                setScale(1);
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        const timeoutId = setTimeout(updateScale, 150);
        return () => {
            window.removeEventListener('resize', updateScale);
            clearTimeout(timeoutId);
        };
    }, [isMobile, boardSpanX, tiles]);


    const requestGameFullscreen = () => {
        if (typeof window !== 'undefined') {
            const container = containerRef.current || document.documentElement;
            if (container && !document.fullscreenElement) {
                if (typeof container.requestFullscreen === 'function') {
                    container.requestFullscreen().catch(() => {});
                } else if (typeof (container as any).webkitRequestFullscreen === 'function') {
                    (container as any).webkitRequestFullscreen();
                }
            }
        }
    };

    const getDailyEvent = async (signal?: AbortSignal) => {
        try {
            const today = new Date();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const targetString = `-${month}-${day}`; // e.g. "-06-25"

            const images = await MahjongService.getMahjongImages(undefined, signal);
            const eventImages = images.filter(img => img.source === 'supabase' && img.date);

            // Find match in date string
            let dailyImg = eventImages.find(img => img.date && img.date.includes(targetString));

            // Fallback: if no date matches today, pick a random supabase event image
            if (!dailyImg && eventImages.length > 0) {
                dailyImg = eventImages[Math.floor(Math.random() * eventImages.length)];
            }

            return dailyImg || null;
        } catch (e) {
            console.error('Failed to resolve daily event:', e);
            return null;
        }
    };

    const initializeDailyGame = async (signal?: AbortSignal) => {
        // Fetch daily event
        const dailyEvent = await getDailyEvent(signal);
        const pairs: TileContent[] = [];

        if (dailyEvent) {
            pairs.push({
                type: 'custom',
                value: dailyEvent.url
            });

            // Register details map metadata
            const detailsMap = new Map<string, { title: string; description: string; date: string }>();
            detailsMap.set(dailyEvent.url, {
                title: dailyEvent.title || 'Recuerdo Diario',
                description: dailyEvent.description || 'Un hermoso recuerdo de nuestra historia.',
                date: dailyEvent.date ? DATE_FORMATTER.format(new Date(dailyEvent.date)) : 'Fecha especial'
            });
            setEventDetailsMap(detailsMap);

            setDailyUnlockedMemory({
                title: dailyEvent.title || 'Recuerdo Diario',
                description: dailyEvent.description || 'Un hermoso recuerdo de nuestra historia.',
                imageUrl: dailyEvent.url,
                date: dailyEvent.date ? DATE_FORMATTER.format(new Date(dailyEvent.date)) : 'Fecha especial'
            });
        }

        // Special calendar date and time tiles
        const todayObj = new Date();
        const dayStr = String(todayObj.getDate());
        const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const monthStr = monthNames[todayObj.getMonth()];
        const dateValue = `${dayStr} ${monthStr}`;

        const hours = String(todayObj.getHours()).padStart(2, '0');
        const minutes = String(todayObj.getMinutes()).padStart(2, '0');
        const timeValue = `${hours}:${minutes}`;

        pairs.push({
            type: 'calendar_date',
            value: dateValue
        });

        pairs.push({
            type: 'clock_time',
            value: timeValue
        });

        // 33% chance to inject bottle message tile so they can write (if they haven't sent a message today)
        const hasSentMsg = await MahjongService.hasPendingSentMessage(profile as 'el' | 'ella');
        if (!hasSentMsg && Math.random() < 0.33) {
            pairs.push({
                type: 'bottle_message',
                value: 'write'
            });
        }

        // Inject drawing tiles (match every game until 00:00)
        if (todayReceivedDrawing) {
            pairs.push({
                type: 'drawing_tile',
                value: 'reveal'
            });
        }
        if (todaySentDrawing) {
            pairs.push({
                type: 'drawing_tile',
                value: 'reveal_own'
            });
        }
        if (!todaySentDrawing) {
            pairs.push({
                type: 'drawing_tile',
                value: 'draw'
            });
        }

        // Generate coordinates for daily challenge (64 pairs = 128 tiles on desktop)
        const mobileState = typeof window !== 'undefined' && window.innerWidth <= 768;
        let finalCoords = generateCoordinates('random', 128);
        if (mobileState) {
            finalCoords = filterCoordsByColumns(finalCoords, 8);
            if (finalCoords.length % 2 !== 0) {
                finalCoords = finalCoords.slice(0, finalCoords.length - 1);
            }
        }

        const targetTiles = finalCoords.length;
        const pairsCount = targetTiles / 2;

        let emojiIdx = 0;
        while (pairs.length < pairsCount) {
            pairs.push({ type: 'traditional', value: activeTileset.tiles[emojiIdx % activeTileset.tiles.length] });
            emojiIdx++;
        }

        let initialTiles = generateSolvableBoard(finalCoords, pairs);
        if (!initialTiles) {
            const fullDeck = shuffleArray([...pairs, ...pairs]);
            initialTiles = finalCoords.map((coord, idx) => ({
                id: `tile_${idx}`,
                x: coord.x,
                y: coord.y,
                z: coord.z,
                content: fullDeck[idx],
                isMatched: false,
                isSelected: false,
                isHinted: false
            }));
        }

        setTiles(initialTiles);
        setInitialDeal(initialTiles);
        setMatchedCount(0);
        setUndoStack([]);
        setDockIds([]);
        resetFireStreak();
        setGameLost(false);
        setLostReason(null);
        setIsReturningFlipped(false);
        setTimerActive(false);
        timerRef.current?.resetTime();
        setScoreSaved(false);
        setIsNewRecord(false);
        setIsLoaded(true);
        setHasStarted(false);
    };

    const handleStartCoopGame = async (selectedLayout: LayoutType) => {
        requestGameFullscreen();
        setIsLoaded(false);
        const mobileState = window.innerWidth <= 768;
        const images = await MahjongService.getMahjongImages();
        const fetchedImages = shuffleArray(images);

        const detailsMap = new Map<string, { title: string; description: string; date: string }>();
        for (const img of images) {
            if (img.source === 'supabase' && img.url) {
                detailsMap.set(img.url, {
                    title: img.title || 'Recuerdo Especial',
                    description: img.description || 'Un hermoso recuerdo de nuestra historia.',
                    date: img.date ? DATE_FORMATTER.format(new Date(img.date)) : 'Fecha especial'
                });
            }
        }
        setEventDetailsMap(detailsMap);

        const level = 1 + Math.floor(completedGamesCount / 15);
        const tilesCount = getTargetTilesForLevel(level);
        const pairsCount = tilesCount / 2;
        const pairs: TileContent[] = [];

        // 33% chance to inject bottle message tile so they can write (if they haven't sent a message today)
        const hasSentMsg = await MahjongService.hasPendingSentMessage(profile as 'el' | 'ella');
        if (!hasSentMsg && Math.random() < 0.33) {
            pairs.push({
                type: 'bottle_message',
                value: 'write'
            });
        }

        // Fill remaining pairs
        for (let i = 0; i < Math.min(fetchedImages.length, pairsCount - pairs.length); i++) {
            const img = fetchedImages[i];
            pairs.push({
                type: img.source === 'supabase' ? 'custom' : 'local_image',
                value: img.url
            });
        }

        // Mix both players' unlocked tilesets
        const myUnlockedTiles = getUnlockedTilesForCount(completedGamesCount);
        const partnerUnlockedTiles = getUnlockedTilesForCount(partnerCompletedGames);
        const mixedTilesPool = shuffleArray(Array.from(new Set([...myUnlockedTiles, ...partnerUnlockedTiles])));

        let emojiIdx = 0;
        while (pairs.length < pairsCount) {
            pairs.push({
                type: 'traditional',
                value: mixedTilesPool[emojiIdx % mixedTilesPool.length]
            });
            emojiIdx++;
        }

        let rawCoords = generateCoordinates(selectedLayout, tilesCount);
        if (mobileState) {
            rawCoords = filterCoordsByColumns(rawCoords, 8);
        }
        let initialTiles = generateSolvableBoard(rawCoords, pairs);
        if (!initialTiles) {
            const fullDeck = shuffleArray([...pairs, ...pairs]);
            initialTiles = rawCoords.map((coord, idx) => ({
                id: `tile_${idx}`,
                x: coord.x,
                y: coord.y,
                z: coord.z,
                content: fullDeck[idx],
                isMatched: false,
                isSelected: false,
                isHinted: false
            }));
        }

        const game = await MahjongService.createCoopGame(selectedLayout, initialTiles, profile as 'el' | 'ella');
        if (game) {
            setActiveCoopGame(game);
            setCoopTurn(profile as 'el' | 'ella');
            setTiles(initialTiles);
            setInitialDeal(initialTiles);
            setMatchedCount(0);
            setUndoStack([]);
            setDockIds([]);
            setGameLost(false);
            setTimerActive(false);
            timerRef.current?.resetTime();
            setScoreSaved(false);
            setIsNewRecord(false);
            setIsLoaded(true);
        setHasStarted(false);
        }
    };

    const handleLoadCoopGame = async (game: any, signal?: AbortSignal) => {
        const images = await MahjongService.getMahjongImages(undefined, signal);
        const detailsMap = new Map<string, { title: string; description: string; date: string }>();
        for (const img of images) {
            if (img.source === 'supabase' && img.url) {
                detailsMap.set(img.url, {
                    title: img.title || 'Recuerdo Especial',
                    description: img.description || 'Un hermoso recuerdo de nuestra historia.',
                    date: img.date ? DATE_FORMATTER.format(new Date(img.date)) : 'Fecha especial'
                });
            }
        }
        setEventDetailsMap(detailsMap);

        setActiveCoopGame(game);
        setTiles(game.tiles);
        setInitialDeal(game.tiles);
        setDockIds(game.dock_ids || []);
        setCoopTurn(game.active_turn);
        // ⚡ Bolt Optimization: Prevent O(N) intermediate array allocation when counting matched tiles
        let initialMatched = 0;
        for (let i = 0; i < game.tiles.length; i++) {
            if (game.tiles[i].isMatched) initialMatched++;
        }
        setMatchedCount(initialMatched);
        setCurrentLayout(game.layout as LayoutType);

        // Check for pending bottle message

        setUndoStack([]);
        setGameLost(false);
        setTimerActive(false);
        timerRef.current?.resetTime();
        setScoreSaved(false);
        setIsNewRecord(false);
        setIsLoaded(true);
        setHasStarted(false);
    };

    const initializeGame = async (layoutParam?: LayoutType, signal?: AbortSignal) => {
        if (gameMode === 'coop') {
            const activeGame = await MahjongService.getActiveCoopGame();
            if (activeGame) {
                await handleLoadCoopGame(activeGame, signal);
            } else {
                setActiveCoopGame(null);
                setIsLoaded(true);
        setHasStarted(false);
            }
            return;
        }

        if (gameMode === 'daily') {
            await initializeDailyGame(signal);
            return;
        }

        const mobileState = window.innerWidth <= 768;
        const images = await MahjongService.getMahjongImages(undefined, signal);

        // Registrar metadatos de recuerdos de Supabase
        const detailsMap = new Map<string, { title: string; description: string; date: string }>();
        for (const img of images) {
            if (img.source === 'supabase' && img.url) {
                detailsMap.set(img.url, {
                    title: img.title || 'Recuerdo Especial',
                    description: img.description || 'Un hermoso recuerdo de nuestra historia.',
                    date: img.date ? DATE_FORMATTER.format(new Date(img.date)) : 'Fecha especial'
                });
            }
        }
        setEventDetailsMap(detailsMap);

        const fetchedImages: { url: string, source: 'supabase' | 'local', title?: string, description?: string, date?: string }[] = shuffleArray(images);

        let selectedLayout = layoutParam || currentLayout;
        if (!selectedLayout) {
            const layouts: LayoutType[] = ['turtle', 'fortress', 'peaks', 'random'];
            selectedLayout = layouts[Math.floor(Math.random() * layouts.length)];
        }
        setCurrentLayout(selectedLayout);

        const level = 1 + Math.floor(completedGamesCount / 15);
        const tilesCount = getTargetTilesForLevel(level);
        const pairsCount = tilesCount / 2;
        const pairs: TileContent[] = [];

        // 33% chance to inject bottle message tile so they can write (if they haven't sent a message today)
        const hasSentMsg = await MahjongService.hasPendingSentMessage(profile as 'el' | 'ella');
        if (!hasSentMsg && Math.random() < 0.33) {
            pairs.push({
                type: 'bottle_message',
                value: 'write'
            });
        }

        // Inject drawing tiles (match every game until 00:00)
        if (todayReceivedDrawing) {
            pairs.push({
                type: 'drawing_tile',
                value: 'reveal'
            });
        }
        if (todaySentDrawing) {
            pairs.push({
                type: 'drawing_tile',
                value: 'reveal_own'
            });
        }
        if (!todaySentDrawing) {
            pairs.push({
                type: 'drawing_tile',
                value: 'draw'
            });
        }

        for (let i = 0; i < Math.min(fetchedImages.length, pairsCount - pairs.length); i++) {
            const img = fetchedImages[i];
            pairs.push({
                type: img.source === 'supabase' ? 'custom' : 'local_image',
                value: img.url
            });
        }
        let emojiIdx = 0;
        while (pairs.length < pairsCount) {
            pairs.push({ type: 'traditional', value: activeTileset.tiles[emojiIdx % activeTileset.tiles.length] });
            emojiIdx++;
        }
        let rawCoords = generateCoordinates(selectedLayout, tilesCount);
        if (mobileState) {
            rawCoords = filterCoordsByColumns(rawCoords, 8);
        }
        let initialTiles = generateSolvableBoard(rawCoords, pairs);
        if (!initialTiles) {
            const fullDeck = shuffleArray([...pairs, ...pairs]);
            initialTiles = rawCoords.map((coord, idx) => ({
                id: `tile_${idx}`,
                x: coord.x,
                y: coord.y,
                z: coord.z,
                content: fullDeck[idx],
                isMatched: false,
                isSelected: false,
                isHinted: false
            }));
        }
        
        // Flipped-down tiles on the last 5 levels of each 15-game set (indices 10 to 14)
        const isFlippedLevel = (completedGamesCount % 15) >= 10;
        if (isFlippedLevel && initialTiles) {
            initialTiles = initialTiles.map((t, idx) => ({
                ...t,
                isFlippedDown: idx % 2 === 0
            }));
        }

        // Apply hardening mechanics based on level (solo mode only)
        let selectedMechanics: HardeningMechanic[] = [];
        if (initialTiles && gameMode === 'solo') {
            selectedMechanics = selectActiveMechanicsForGame(level);
            initialTiles = applyHardeningToBoard(initialTiles, selectedMechanics, level);
        }
        setActiveMechanics(selectedMechanics);

        setInitialDeal(initialTiles);
        setTiles(initialTiles);
        setMatchedCount(0);
        setUndoStack([]);
        setDockIds([]);
        resetFireStreak();
        // Reset hardening timers
        ghostElapsedRef.current = 0;
        setGhostSolidIds(new Set());
        matchCountSinceSmoke.current = 0;
        if (bombTickRef.current) clearInterval(bombTickRef.current);
        if (ghostTickRef.current) clearInterval(ghostTickRef.current);
        if (smokeTimerRef.current) clearTimeout(smokeTimerRef.current);
        setMaxGameCombo(0);
        setGameLost(false);
        setLostReason(null);
        setIsReturningFlipped(false);
        setTimerActive(false);
        timerRef.current?.resetTime();
        setScoreSaved(false);
        setIsNewRecord(false);
        setIsLoaded(true);
        setHasStarted(false);
    };

    useEffect(() => {
        const abortController = new AbortController();
        if (!isLoaded) { initializeGame(undefined, abortController.signal); }
        return () => abortController.abort();
    }, [isLoaded, gameMode]);

    const { freeTilesMap, tilesById, dockTilesByValue } = useMemo(() => {
        const freeMap = new Map<string, boolean>();
        const idMap = new Map<string, TileState>();
        const dockTilesByValue = new Map<string, TileState>();
        const dockSet = new Set(dockIds);
        const grid = new Set<number>();

        for (const tile of tiles) {
            idMap.set(tile.id, tile);
            if (!tile.isMatched && !dockSet.has(tile.id)) {
                grid.add(tile.z * 10000 + tile.y * 100 + tile.x);
            }
        }

        for (const tile of tiles) {
            if (tile.isMatched || dockSet.has(tile.id)) {
                freeMap.set(tile.id, false);
                continue;
            }

            const { x, y, z } = tile;
            const zUp = (z + 1) * 10000;

            // ⚡ Bolt Optimization: Unrolled loops for O(1) direct property lookups to avoid O(N) nested loops
            if (grid.has(zUp + (y - 1) * 100 + (x - 1)) ||
                grid.has(zUp + (y - 1) * 100 + x) ||
                grid.has(zUp + (y - 1) * 100 + (x + 1)) ||
                grid.has(zUp + y * 100 + (x - 1)) ||
                grid.has(zUp + y * 100 + x) ||
                grid.has(zUp + y * 100 + (x + 1)) ||
                grid.has(zUp + (y + 1) * 100 + (x - 1)) ||
                grid.has(zUp + (y + 1) * 100 + x) ||
                grid.has(zUp + (y + 1) * 100 + (x + 1))) {
                freeMap.set(tile.id, false);
                continue;
            }

            const zSame = z * 10000;

            const hasLeft =
                grid.has(zSame + (y - 1) * 100 + (x - 2)) ||
                grid.has(zSame + y * 100 + (x - 2)) ||
                grid.has(zSame + (y + 1) * 100 + (x - 2)) ||
                grid.has(zSame + (y - 1) * 100 + (x - 1)) ||
                grid.has(zSame + y * 100 + (x - 1)) ||
                grid.has(zSame + (y + 1) * 100 + (x - 1));

            if (!hasLeft) {
                freeMap.set(tile.id, true);
                continue;
            }

            const hasRight =
                grid.has(zSame + (y - 1) * 100 + (x + 1)) ||
                grid.has(zSame + y * 100 + (x + 1)) ||
                grid.has(zSame + (y + 1) * 100 + (x + 1)) ||
                grid.has(zSame + (y - 1) * 100 + (x + 2)) ||
                grid.has(zSame + y * 100 + (x + 2)) ||
                grid.has(zSame + (y + 1) * 100 + (x + 2));

            freeMap.set(tile.id, !hasRight);
        }
        for (const id of dockIds) {
            const t = idMap.get(id);
            if (t) dockTilesByValue.set(t.content.value, t);
        }
        return { freeTilesMap: freeMap, tilesById: idMap, dockTilesByValue };
    }, [tiles, dockIds]);


    const handleTilePointerDown = useCallback((id: string) => {
        if (isProcessingRef.current || gameLost || isReturningFlipped) return;
        if (dockIds.includes(id)) {
            // Devolver la ficha seleccionada del dock de vuelta al tablero
            const updatedDock = dockIds.filter(dId => dId !== id);
            setDockIds(updatedDock);
            setUndoStack(us => us.filter(move => !move.includes(id)));
            MahjongAudio.playPickup();
            if (gameMode === 'coop' && activeCoopGame) {
                MahjongService.updateCoopGame(activeCoopGame.id, tiles, updatedDock, coopTurn);
            }
            return;
        }
        const tile = tilesById.get(id);
        if (!tile || tile.isMatched || !freeTilesMap.get(id)) return;

        // Hardening click blocks
        if (tile.isLocked) return;
        if (tile.iceCounter && tile.iceCounter > 0) return;
        if (tile.isGhost && !ghostSolidIds.has(tile.id)) return;
        if (tile.isSmoked) return;

        // Fullscreen activation when a match is started / played on first tile click
        if (typeof window !== 'undefined') {
            const container = document.documentElement;
            if (container && !document.fullscreenElement) {
                if (typeof container.requestFullscreen === 'function') {
                    container.requestFullscreen().catch(() => {});
                } else if (typeof (container as any).webkitRequestFullscreen === 'function') {
                    (container as any).webkitRequestFullscreen();
                }
            }
        }

        // Memory game mechanic: if we have 2 unmatched flipped-down cards, return them to board
        // ⚡ Bolt Optimization: Replace dockIds.map().find() with a single-pass loop to avoid intermediate array allocation
        let flippedInDock = undefined;
        for (const dId of dockIds) {
            const t = tilesById.get(dId);
            if (t?.isFlippedDown && !t.isMatched) {
                flippedInDock = t;
                break;
            }
        }
        if (tile.isFlippedDown && flippedInDock && flippedInDock.content.value !== tile.content.value) {
            // Add clicked tile to the dock temporarily so player sees it
            const updatedDock = [...dockIds, id];
            setDockIds(updatedDock);
            setIsReturningFlipped(true);

            setTimeout(() => {
                setDockIds(currentDock => currentDock.filter(dId => dId !== id && dId !== flippedInDock.id));
                setIsReturningFlipped(false);
            }, 1000);
            return;
        }

        isProcessingRef.current = true;
        requestAnimationFrame(() => { isProcessingRef.current = false; });
        if (!timerActive && matchedCount < tiles.length) { setTimerActive(true); }

        // ⚡ Bolt Optimization: O(1) dock checks using pre-calculated map
        const matchingDockTile = dockTilesByValue.get(tile.content.value);
        const matchingDockId = matchingDockTile?.id;

        if (matchingDockId && matchingDockTile) {
            let processedTiles = tiles.map(t => {
                if (t.id === matchingDockTile.id || t.id === tile.id) {
                    return { ...t, isMatched: true, isSelected: false };
                }
                return t;
            });
            const updatedDock = dockIds.filter(did => did !== matchingDockId);

            // ─── Hardening match processing (solo mode) ───
            if (gameMode === 'solo') {
                // Ice: thaw adjacent tiles
                if (activeMechanics.includes('ice')) {
                    processedTiles = processIceOnMatch(processedTiles, tile, matchingDockTile);
                }
                // Padlock: unlock if key pair matched
                if (activeMechanics.includes('padlock')) {
                    processedTiles = processLockUnlock(processedTiles, tile);
                    processedTiles = processLockUnlock(processedTiles, matchingDockTile);
                }
                // Bomb: defuse if bomb tile was matched
                processedTiles = processedTiles.map(t => {
                    if ((t.id === tile.id || t.id === matchingDockTile.id) && t.isBomb) {
                        return { ...t, isBomb: false, bombTimer: undefined };
                    }
                    return t;
                });
                // Gravity: collapse unsupported tiles
                if (activeMechanics.includes('gravity')) {
                    processedTiles = applyGravityCollapse(processedTiles);
                }
                // Smoke: trigger new smoke after every 4 matches
                if (activeMechanics.includes('smoke')) {
                    matchCountSinceSmoke.current += 1;
                    if (matchCountSinceSmoke.current >= 4) {
                        matchCountSinceSmoke.current = 0;
                        const { tiles: smokedTiles } = triggerNewSmokeBomb(processedTiles);
                        processedTiles = smokedTiles;
                        // Clear smoke after 15 seconds
                        if (smokeTimerRef.current) clearTimeout(smokeTimerRef.current);
                        smokeTimerRef.current = setTimeout(() => {
                            setTiles(prev => clearSmoke(prev));
                        }, 15000);
                    }
                }
            }

            setUndoStack(us => [...us, [matchingDockTile.id, tile.id]]);
            setMatchedCount(mc => mc + 2);
            setDockIds(updatedDock);
            setTiles(processedTiles);

            // Fire streak combo logic
            const nextCombo = streakCombo + 1;
            triggerStreakCombo(nextCombo);

            // Sync to Coop Game in DB & Auto-Turn Pass
            if (gameMode === 'coop' && activeCoopGame) {
                const newMatchedCount = matchedCount + 2;
                const halfMatched = Math.floor(tiles.length / 2);
                if (newMatchedCount === halfMatched) {
                    const nextTurn = coopTurn === 'el' ? 'ella' : 'el';
                    setCoopTurn(nextTurn);
                    MahjongService.updateCoopGame(activeCoopGame.id, processedTiles, updatedDock, nextTurn, profile as 'el' | 'ella');

                    const target = profile === 'el' ? 'ella' : 'el';
                    const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                    NotificationService.addNotification(
                        target,
                        'mahjong_coop_turn',
                        `¡${authorName} completó la mitad del tablero! Tu turno de terminar el juego.`
                    ).catch(console.error);
                    notifySuccess(`Mitad del tablero completada (${halfMatched} fichas). El turno pasa a tu pareja.`, 'Relevo cooperativo');
                } else {
                    MahjongService.updateCoopGame(activeCoopGame.id, processedTiles, updatedDock, coopTurn, profile as 'el' | 'ella');
                }
            }

            // Si es un recuerdo de Supabase (dorado), pausar temporizador y mostrar modal
            if (tile.content.type === 'custom') {
                const eventInfo = eventDetailsMap.get(tile.content.value);
                setTimerActive(false); // Pausar temporizador
                setTimeout(() => {
                    setMemoryModalData({
                        imageUrl: tile.content.value,
                        title: eventInfo?.title || 'Recuerdo Especial',
                        description: eventInfo?.description || 'Un hermoso recuerdo de nuestra historia.',
                        date: eventInfo?.date || 'Fecha especial'
                    });
                }, 800);
            }

            // Si es un mensaje en la botella (para escribir)
            if (tile.content.type === 'bottle_message') {
                setTimerActive(false); // Pausar
                MahjongService.hasPendingSentMessage(profile as 'el' | 'ella').then((hasPending) => {
                    if (hasPending) {
                        notifyWarning('Ya tienes una botella en el océano esperando a que tu pareja la encuentre.', 'Botella pendiente');
                        if (!gameLost && matchedCount < tiles.length) {
                            setTimerActive(true);
                        }
                    } else {
                        setBottleNoteModal(true);
                    }
                }).catch(() => {
                    setBottleNoteModal(true);
                });
            }

            // Si es un dibujo especial (drawing_tile)
            if (tile.content.type === 'drawing_tile') {
                setTimerActive(false); // Pausar temporizador
                const actionType = tile.content.value; // 'draw' | 'reveal' | 'reveal_own'
                if (actionType === 'draw') {
                    setDrawingModalOpen(true);
                } else if (actionType === 'reveal') {
                    setRevealedDrawingData({
                        sender: profile === 'el' ? 'Milena' : 'Santiago',
                        image: todayReceivedDrawing?.drawing_data,
                        caption: todayReceivedDrawing?.caption || '¡Mira lo que te dibujé! 💖'
                    });
                    setRevealDrawingModalOpen(true);
                } else if (actionType === 'reveal_own') {
                    setRevealedDrawingData({
                        sender: profile === 'el' ? 'Santiago' : 'Milena',
                        image: todaySentDrawing?.drawing_data,
                        caption: todaySentDrawing?.caption || 'Tu dibujo de hoy ✨'
                    });
                    setRevealDrawingModalOpen(true);
                }
            }
        } else {
            const updatedDock = [...dockIds, id];
            if (dockIds.length >= 2) {
                setGameLost(true);
                setLostReason('dock');
                setDockIds(updatedDock);
                setUndoStack(us => [...us, [id]]);
                setTimerActive(false);
                resetFireStreak();
                MahjongAudio.playError();
                if (gameMode === 'coop' && activeCoopGame) {
                    MahjongService.updateCoopGame(activeCoopGame.id, tiles, updatedDock, coopTurn);
                } else if (gameMode === 'daily') {
                    const dateStr = getLocalDateString();
                    MahjongService.updateDailyPuzzleStatus(profile as 'el' | 'ella', dateStr, 'failed')
                        .then(() => refreshConnectionFeatures());
                }
            } else {
                setDockIds(updatedDock);
                setUndoStack(us => [...us, [id]]);
                MahjongAudio.playPickup();
                if (gameMode === 'coop' && activeCoopGame) {
                    MahjongService.updateCoopGame(activeCoopGame.id, tiles, updatedDock, coopTurn);
                }
            }
        }
    }, [tilesById, gameLost, dockIds, tiles, freeTilesMap, timerActive, matchedCount, eventDetailsMap, gameMode, activeCoopGame, coopTurn, profile, pendingReceivedBottle, isReturningFlipped, resetFireStreak]);

    const handleRestart = () => {
        if (initialDeal) {
            setTiles([...initialDeal]);
            setMatchedCount(0);
            setUndoStack([]);
            setDockIds([]);
            resetFireStreak();
            
            // Reset hardening timers
            ghostElapsedRef.current = 0;
            setGhostSolidIds(new Set());
            matchCountSinceSmoke.current = 0;
            if (bombTickRef.current) clearInterval(bombTickRef.current);
            if (ghostTickRef.current) clearInterval(ghostTickRef.current);
            if (smokeTimerRef.current) clearTimeout(smokeTimerRef.current);

            setMaxGameCombo(0);
            setGameLost(false);
            setLostReason(null);
            setIsReturningFlipped(false);
            setTimerActive(false);
            timerRef.current?.resetTime();
            setScoreSaved(false);
            setIsNewRecord(false);

            if (gameMode === 'coop' && activeCoopGame) {
                MahjongService.updateCoopGame(activeCoopGame.id, initialDeal, [], coopTurn);
            }
        }
    };

    const handleUndo = () => {
        if (undoStack.length === 0) return;
        const lastMove = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, prev.length - 1));
        let updatedTiles = tiles;
        let updatedDock = dockIds;
        if (lastMove.length === 2) {
            const [id1, id2] = lastMove;
            updatedTiles = tiles.map(t =>
                (t.id === id1 || t.id === id2) ? { ...t, isMatched: false, isSelected: false } : t
            );
            setTiles(updatedTiles);
            setMatchedCount(mc => mc - 2);
        } else {
            const [id] = lastMove;
            updatedDock = dockIds.filter(did => did !== id);
            setDockIds(updatedDock);
            setGameLost(false);
        }

        if (gameMode === 'coop' && activeCoopGame) {
            MahjongService.updateCoopGame(activeCoopGame.id, updatedTiles, updatedDock, coopTurn);
        }
    };

    const handleHint = useCallback(() => {
        // ⚡ Bolt Optimization: Use O(1) Set lookup instead of O(M) Array.includes inside an O(N) filter to prevent O(N*M) complexity
        const dockIdsSet = new Set(dockIds);
        const freeOnBoard = tiles.filter(t => !t.isMatched && !dockIdsSet.has(t.id) && freeTilesMap.get(t.id));
        const seenValues = new Map<string, string>();
        for (const tile of freeOnBoard) {
            const value = tile.content.value;
            if (seenValues.has(value)) {
                const id1 = seenValues.get(value)!;
                const id2 = tile.id;
                setTiles(prev => prev.map(t => (t.id === id1 || t.id === id2) ? { ...t, isHinted: true } : t));
                setTimeout(() => {
                    setTiles(prev => prev.map(t => (t.id === id1 || t.id === id2) ? { ...t, isHinted: false } : t));
                }, 2000);
                return;
            }
            seenValues.set(value, tile.id);
        }

        // ⚡ Bolt Optimization: Replace O(N*M) nested loop find with O(N+M) Map lookup for hints
        const freeTilesByValue = new Map();
        for (const t of freeOnBoard) {
            if (!freeTilesByValue.has(t.content.value)) {
                freeTilesByValue.set(t.content.value, t);
            }
        }

        for (const dId of dockIds) {
            const dockTile = tilesById.get(dId);
            if (!dockTile) continue;
            const match = freeTilesByValue.get(dockTile.content.value);
            if (match) {
                setTiles(prev => prev.map(t => t.id === match.id ? { ...t, isHinted: true } : t));
                setTimeout(() => {
                    setTiles(prev => prev.map(t => t.id === match.id ? { ...t, isHinted: false } : t));
                }, 2000);
                return;
            }
        }
    }, [tiles, dockIds, freeTilesMap, tilesById]);

    const getBestForProfile = (p: 'el' | 'ella') => {
        const scores = leaderboard[p];
        return scores.length > 0 ? scores[0] : null;
    };

    const gameWon = matchedCount === tiles.length && tiles.length > 0;

    const percent = tiles.length > 0 ? (matchedCount / tiles.length) * 100 : 0;
    const filledSegments = Math.round((percent / 100) * 24);

    const layoutName = gameMode === 'coop' ? 'Cooperativo' : gameMode === 'daily' ? 'Diario' : (LAYOUT_INFO[currentLayout]?.name || currentLayout);

    // ⚡ Bolt Optimization: Replace .filter().map() chain with a single pass O(N) loop to avoid intermediate array allocations
    const parsedLevelScores = useMemo(() => {
        const result = [];
        for (const score of allScores) {
            if (score.layout !== 'daily') {
                let parsedLevel = 1;
                let parsedLayout = score.layout;
                if (score.layout && score.layout.includes(':')) {
                    const parts = score.layout.split(':');
                    parsedLayout = parts[0];
                    parsedLevel = parseInt(parts[1], 10) || 1;
                } else {
                    parsedLevel = score.tile_count === 96 ? 3 : score.tile_count === 88 ? 2 : 1;
                }
                result.push({
                    ...score,
                    parsedLayout,
                    parsedLevel
                });
            }
        }
        return result;
    }, [allScores]);

    const levelComparisons = useMemo(() => {
        if (gameMode !== 'solo') return [];

        const comparisons: {
            levelLabel: string;
            elLvl: number;
            ellaLvl: number;
            elTime: number | null;
            ellaTime: number | null;
            elCombo: number;
            ellaCombo: number;
        }[] = [];

        for (let offset = 0; offset < 3; offset++) {
            const currentWinnerLvl = level - offset;
            if (currentWinnerLvl < 1) break;

            const isWinnerEl = profile === 'el';
            const partnerMaxLvl = partnerLevel;

            let elLvl: number;
            let ellaLvl: number;

            if (isWinnerEl) {
                elLvl = currentWinnerLvl;
                ellaLvl = Math.min(partnerMaxLvl, currentWinnerLvl);
            } else {
                ellaLvl = currentWinnerLvl;
                elLvl = Math.min(partnerMaxLvl, currentWinnerLvl);
            }

            // ⚡ Bolt Optimization: Replace multiple .filter() calls with a single pass O(N) loop
            let elTime: number | null = null;
            let elCombo = 0;
            let ellaTime: number | null = null;
            let ellaCombo = 0;

            for (const s of parsedLevelScores) {
                if (s.profile === 'el' && s.parsedLevel === elLvl) {
                    if (elTime === null || s.time_seconds < elTime) elTime = s.time_seconds;
                    if ((s.highest_combo || 0) > elCombo) elCombo = s.highest_combo || 0;
                } else if (s.profile === 'ella' && s.parsedLevel === ellaLvl) {
                    if (ellaTime === null || s.time_seconds < ellaTime) ellaTime = s.time_seconds;
                    if ((s.highest_combo || 0) > ellaCombo) ellaCombo = s.highest_combo || 0;
                }
            }

            comparisons.push({
                levelLabel: offset === 0 ? 'Nivel Actual' : `Nivel ${currentWinnerLvl}`,
                elLvl,
                ellaLvl,
                elTime,
                ellaTime,
                elCombo,
                ellaCombo
            });
        }

        return comparisons;
    }, [gameMode, level, partnerLevel, profile, parsedLevelScores]);

    return (
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden max-md:overflow-visible">

            {/* Fuego perimetral que rodea la pantalla según el combo */}
            <ComboFireFrame combo={streakCombo} />

            {/* Floating gaming brutalist combo sign overlay */}
            <AnimatePresence>
                {comboSign && <ComboSign comboSign={comboSign} />}
            </AnimatePresence>

            <GameModeTabs
                gameMode={gameMode}
                setGameMode={setGameMode}
                setIsLoaded={setIsLoaded}
                requestGameFullscreen={requestGameFullscreen}
                handleLoadCoopGame={handleLoadCoopGame}
                setActiveCoopGame={setActiveCoopGame}
            />
            <HeaderStatus
                level={level}
                activeTileset={activeTileset}
                layoutName={layoutName}
                accentColor={accentColor}
                completedGamesCount={completedGamesCount}
                pendingReceivedBottle={pendingReceivedBottle}
                todayRevealedBottle={todayRevealedBottle}
                setShowMessageText={setShowMessageText}
                setHasPausedForMessage={setHasPausedForMessage}
                setRevealedBottleMessage={setRevealedBottleMessage}
            >
                <HardeningBadges activeMechanics={activeMechanics} gameMode={gameMode} />
            </HeaderStatus>




            <GameLostModal
                gameLost={gameLost}
                lostReason={lostReason}
                handleRestart={handleRestart}
                handleUndo={handleUndo}
            />

            {/* Modal de Recuerdo Desbloqueado */}

            <MemoryUnlockedModal
                memoryModalData={memoryModalData}
                setMemoryModalData={setMemoryModalData}
                setTimerActive={setTimerActive}
            />


            <GameWonModal
                gameWon={gameWon}
                gameMode={gameMode}
                profile={profile as 'el' | 'ella'}
                accentColor={accentColor}
                accentClass={accentClass}
                secondaryColor={secondaryColor}
                isNewRecord={isNewRecord}
                formatTime={formatTime}
                timeSeconds={timerRef.current?.getTime() || 0}
                maxGameCombo={maxGameCombo}
                leaderboard={leaderboard}
                levelComparisons={levelComparisons}
                setIsLoaded={setIsLoaded}
            />


            <BottleMessageModal
                bottleNoteModal={bottleNoteModal}
                bottleNoteText={bottleNoteText}
                setBottleNoteText={setBottleNoteText}
                handleCloseWriteModal={handleCloseWriteModal}
                onSend={async () => {
                    if (bottleNoteText.trim()) {
                        const success = await MahjongService.createBottleMessage(profile as 'el' | 'ella', bottleNoteText);
                        if (success) {
                            notifySuccess('Tu mensaje ha sido embotellado y arrojado al océano.', 'Botella enviada');
                            const target = profile === 'el' ? 'ella' : 'el';
                            const senderName = profile === 'el' ? 'Santiago' : 'Milena';
                            NotificationService.addNotification(
                                target,
                                'bottle_sent',
                                `¡${senderName} te ha arrojado una botella al mar! Juega para encontrarla. 🍾`
                            ).catch(e => console.error(e));
                            handleCloseWriteModal();
                            refreshConnectionFeatures();
                        }
                    }
                }}
                revealedBottleMessage={revealedBottleMessage}
                videoRef={videoRef}
                hasPausedForMessage={hasPausedForMessage}
                setHasPausedForMessage={setHasPausedForMessage}
                showMessageText={showMessageText}
                setShowMessageText={setShowMessageText}
                onRevealComplete={() => {
                    if (pendingReceivedBottle && revealedBottleMessage?.id === pendingReceivedBottle.id) {
                        MahjongService.revealBottleMessage(pendingReceivedBottle.id, profile as 'el' | 'ella')
                            .then(() => refreshConnectionFeatures());
                    }
                    setRevealedBottleMessage(null);
                    setTimerActive(true);
                    setHasPausedForMessage(false);
                    setShowMessageText(false);
                }}
                profile={profile}
            />

            <div
                className={`flex w-full ${hasStarted ? 'fixed inset-0 z-[99999] h-[100dvh] w-[100dvw] bg-[#050505] max-w-none' : 'relative max-w-[880px] h-[720px] max-md:h-[650px]'} ${comboShake ? 'animate-combo-shake' : ''} max-md:max-w-none max-md:w-screen max-md:shrink-0 flex-col justify-center overflow-hidden border border-white/10 max-md:border-x-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent)] transition-all duration-500`}
                ref={containerRef}
            >
                <div className="pointer-events-none absolute inset-0 bg-dot-matrix opacity-70" />
                <AnimatedBrutalistCorners color={accentColor} size={12} thickness={1.5} />


                {/* Daily Puzzle stats / scoreboard screen */}
                <DailyStatsModal
                    gameMode={gameMode}
                    dailyPlayRecord={dailyPlayRecord}
                    accentColor={accentColor}
                    DATE_FORMATTER={DATE_FORMATTER}
                    dailyStats={dailyStats}
                    formatTime={formatTime}
                    historicDailyStats={historicDailyStats}
                    handleStartDailyGame={handleStartDailyGame}
                />


                {/* Coop Turn lock screen indicator */}
                <CoopTurnModal
                    gameMode={gameMode}
                    activeCoopGame={activeCoopGame}
                    coopTurn={coopTurn}
                    profile={profile}
                    accentColor={accentColor}
                />

                {/* Coop game setup screen */}
                <CoopSetupModal
                    gameMode={gameMode}
                    activeCoopGame={activeCoopGame}
                    accentColor={accentColor}
                    handleStartCoopGame={handleStartCoopGame}
                />

                {/* Exit Fullscreen button (only visible when hasStarted is true) */}
                {hasStarted && (
                    <button
                        onClick={() => {
                            setHasStarted(false);
                            setTimerActive(false);
                        }}
                        className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] left-3 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-black/80 border border-white/20 text-[#a88a7e] hover:text-white text-xs font-mono font-bold uppercase transition-all backdrop-blur-md"
                        title="Salir del modo pantalla completa"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">SALIR</span>
                    </button>
                )}


                <MahjongHud
                    hasStarted={hasStarted}
                    timerActive={timerActive}
                    formatTime={formatTime}
                    timerRef={timerRef}
                    accentColor={accentColor}
                    streakCombo={streakCombo}
                    streakTimeRemaining={streakTimeRemaining}
                    isMatchPulse={isMatchPulse}
                    matchedCount={matchedCount}
                    tilesLength={tiles.length}
                    handleUndo={handleUndo}
                    undoStackLength={undoStack.length}
                    handleHint={handleHint}
                    gameMode={gameMode}
                    handleRestart={handleRestart}
                    toggleMute={toggleMute}
                    muted={muted}
                />

                <div className="h-6" />


                {isLoaded && !hasStarted && (
                    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <button
                            onClick={() => {
                                MahjongAudio.initAudio();
                                requestGameFullscreen();
                                setHasStarted(true);
                                setTimerActive(true);
                            }}
                            className="bg-purple-600 px-8 py-4 text-xl font-black uppercase tracking-[0.2em] text-white hover:bg-purple-500 active:scale-95 transition-all shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:shadow-[0_0_50px_rgba(139,92,246,0.8)] border border-purple-400"
                        >
                            INICIAR JUEGO 🀄
                        </button>
                    </div>
                )}

                <MahjongCanvas
                    tiles={tiles}
                    freeTilesMap={freeTilesMap}
                    dockIds={dockIds}
                    onTilePointerDown={handleTilePointerDown}
                    isMobile={isMobile}
                    ghostSolidIds={ghostSolidIds}
                    hasStarted={hasStarted}
                    streakCombo={streakCombo}
                />

                {/* Modal para Dibujar */}
                {drawingModalOpen && (
                    <DrawingCanvasModal
                        profile={profile as 'el' | 'ella'}
                        accentColor={accentColor}
                        onClose={() => {
                            setDrawingModalOpen(false);
                            if (!gameLost && matchedCount < tiles.length) {
                                setTimerActive(true);
                            }
                        }}
                        onSave={async (dataUrl, caption) => {
                            try {
                                const success = await MahjongService.saveDrawing(profile as 'el' | 'ella', dataUrl, caption);
                                if (success) {
                                    const target = profile === 'el' ? 'ella' : 'el';
                                    const senderName = profile === 'el' ? 'Santiago' : 'Milena';
                                    NotificationService.addNotification(
                                        target,
                                        'drawing_sent',
                                        `¡${senderName} te ha enviado un dibujo especial! Encuéntralo en tu tablero. 🎨`
                                    ).catch(e => console.error('Error adding drawing notification:', e));
                                    refreshConnectionFeatures();
                                } else {
                                    console.error('saveDrawing returned false');
                                }
                            } catch (err) {
                                console.error('Unhandled error in saveDrawing:', err);
                            } finally {
                                setDrawingModalOpen(false);
                                if (!gameLost && matchedCount < tiles.length) {
                                    setTimerActive(true);
                                }
                            }
                        }}
                    />
                )}

                {/* Modal para Revelar Dibujo */}
                {revealDrawingModalOpen && revealedDrawingData && (
                    <RevealDrawingModal
                        data={revealedDrawingData}
                        onClose={() => {
                            setRevealDrawingModalOpen(false);
                            setRevealedDrawingData(null);
                            if (!gameLost && matchedCount < tiles.length) {
                                setTimerActive(true);
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}
