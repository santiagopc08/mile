'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DOG_CATALOG } from './dogCatalog';
import { ENEMY_CATALOG } from './enemyCatalog';
import { LEVEL_CONFIGS } from './levelConfig';
import { DvmAudio, setDvmMuted, isDvmMuted } from './dvmAudio';
import { DogId, Enemy, PlacedDog, Projectile, Croqueta, Lawnmower, Particle, FloatingText } from './types';
import { Volume2, VolumeX, Sparkles, Trophy, Heart, ArrowRight, Play, RotateCcw, Shield, Zap, Flame, Snowflake, Info } from 'lucide-react';
import { useArcadeProgression } from '@/hooks/useArcadeProgression';
import { useProfile } from '@/context/ProfileContext';

// Game Coordinate Space
const V_WIDTH = 1000;
const V_HEIGHT = 640;

const GRID_ROWS = 5;
const GRID_COLS = 9;
const CELL_W = 86;
const CELL_H = 92;
const GRID_START_X = 175;
const GRID_START_Y = 125;

export function DogsVsMonstersCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const { profile } = useProfile();
    const { recordScore } = useArcadeProgression();

    const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
    const currentLevel = LEVEL_CONFIGS[currentLevelIdx] || LEVEL_CONFIGS[0];

    const [croquetas, setCroquetas] = useState(currentLevel.startingCroquetas);
    const [selectedCard, setSelectedCard] = useState<DogId | null>(null);
    const [isShovelActive, setIsShovelActive] = useState(false);
    const [isPlantFoodActive, setIsPlantFoodActive] = useState(false);
    const [plantFoodCount, setPlantFoodCount] = useState(2);
    const [cooldowns, setCooldowns] = useState<Record<DogId, number>>({
        miel: 0,
        kiaro: 0,
        nika: 0,
        sam: 0,
        boneMine: 0,
        loveBomb: 0,
        boxerDog: 0,
    });

    const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover' | 'levelcleared'>('menu');
    const [levelProgress, setLevelProgress] = useState(0);
    const [hugeWaveWarning, setHugeWaveWarning] = useState(false);
    const [mutedState, setMutedState] = useState(false);
    const [score, setScore] = useState(0);
    const [lastRecordResult, setLastRecordResult] = useState<{ isNewPersonalBest: boolean; isNewCoupleRecord: boolean; coinsEarned: number } | null>(null);

    // Mutable 60 FPS Game Loop State
    const stateRef = useRef({
        dogs: [] as PlacedDog[],
        enemies: [] as Enemy[],
        projectiles: [] as Projectile[],
        croquetas: [] as Croqueta[],
        lawnmowers: [] as Lawnmower[],
        particles: [] as Particle[],
        floatingTexts: [] as FloatingText[],
        croquetaBalance: currentLevel.startingCroquetas,
        cooldowns: {
            miel: 0,
            kiaro: 0,
            nika: 0,
            sam: 0,
            boneMine: 0,
            loveBomb: 0,
            boxerDog: 0,
        } as Record<DogId, number>,
        plantFoodCount: 2,
        selectedCard: null as DogId | null,
        isShovelActive: false,
        isPlantFoodActive: false,
        hoverGrid: null as { row: number; col: number } | null,
        pointerPos: null as { x: number; y: number } | null,
        levelTime: 0,
        nextNaturalCroquetaTimer: 4.5,
        waveIndex: 0,
        totalWaves: currentLevel.waves.length,
        isFinalWaveTriggered: false,
        shakeTime: 0,
        shakeIntensity: 0,
        score: 0,
        gameState: 'menu' as 'menu' | 'playing' | 'paused' | 'gameover' | 'levelcleared',
    });

    // Helper: Map screen pointer coords accurately to canvas 1000x640 coordinate space (accounting for object-contain letterboxing)
    const getCanvasCoordinates = useCallback((e: React.PointerEvent | React.MouseEvent | PointerEvent | MouseEvent): { x: number; y: number } | null => {
        if (!containerRef.current) return null;
        const rect = containerRef.current.getBoundingClientRect();
        const containerW = rect.width;
        const containerH = rect.height;
        if (containerW <= 0 || containerH <= 0) return null;

        const canvasAspect = V_WIDTH / V_HEIGHT; // 1000 / 640 = 1.5625
        const containerAspect = containerW / containerH;

        let renderW = containerW;
        let renderH = containerH;
        let offsetX = 0;
        let offsetY = 0;

        if (containerAspect > canvasAspect) {
            // Container is wider -> Pillarboxing (black bars left/right)
            renderH = containerH;
            renderW = containerH * canvasAspect;
            offsetX = (containerW - renderW) / 2;
            offsetY = 0;
        } else {
            // Container is taller -> Letterboxing (black bars top/bottom)
            renderW = containerW;
            renderH = containerW / canvasAspect;
            offsetX = 0;
            offsetY = (containerH - renderH) / 2;
        }

        const mouseX = e.clientX - rect.left - offsetX;
        const mouseY = e.clientY - rect.top - offsetY;

        const canvasX = (mouseX / renderW) * V_WIDTH;
        const canvasY = (mouseY / renderH) * V_HEIGHT;

        return { x: canvasX, y: canvasY };
    }, []);

    // Initialize lawnmowers on start
    const initLawnmowers = useCallback(() => {
        const mowers: Lawnmower[] = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            mowers.push({
                row: r,
                x: GRID_START_X - 52,
                active: true,
                triggered: false,
            });
        }
        return mowers;
    }, []);

    const addShake = (intensity = 8, dur = 0.25) => {
        const s = stateRef.current;
        s.shakeIntensity = Math.max(s.shakeIntensity, intensity);
        s.shakeTime = Math.max(s.shakeTime, dur);
    };

    const addFloatingText = (x: number, y: number, text: string, color = '#fde047') => {
        stateRef.current.floatingTexts.push({
            id: crypto.randomUUID(),
            x,
            y,
            text,
            color,
            life: 0.9,
            maxLife: 0.9,
        });
    };

    const spawnParticles = (x: number, y: number, color: string, count = 12, speed = 160, isStar = false, isHeart = false, isIce = false) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = speed * (0.35 + Math.random() * 0.85);
            stateRef.current.particles.push({
                x,
                y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color,
                size: isStar || isHeart ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
                life: 0,
                maxLife: 0.4 + Math.random() * 0.4,
                alpha: 1.0,
                isStar,
                isHeart,
                isIce,
            });
        }
    };

    const toggleMute = useCallback(() => {
        const next = !mutedState;
        setDvmMuted(next);
        setMutedState(next);
    }, [mutedState]);

    const selectCardAction = (cardId: DogId | null) => {
        setSelectedCard(cardId);
        stateRef.current.selectedCard = cardId;
        if (cardId) {
            setIsShovelActive(false);
            stateRef.current.isShovelActive = false;
            setIsPlantFoodActive(false);
            stateRef.current.isPlantFoodActive = false;
        }
    };

    const startLevel = useCallback((levelIdx: number) => {
        DvmAudio.init();
        const lvl = LEVEL_CONFIGS[levelIdx] || LEVEL_CONFIGS[0];
        setCurrentLevelIdx(levelIdx);

        const s = stateRef.current;
        s.dogs = [];
        s.enemies = [];
        s.projectiles = [];
        s.croquetas = [];
        s.lawnmowers = initLawnmowers();
        s.particles = [];
        s.floatingTexts = [];
        s.croquetaBalance = lvl.startingCroquetas;
        s.cooldowns = { miel: 0, kiaro: 0, nika: 0, sam: 0, boneMine: 0, loveBomb: 0, boxerDog: 0 };
        s.plantFoodCount = 2;
        s.selectedCard = null;
        s.isShovelActive = false;
        s.isPlantFoodActive = false;
        s.hoverGrid = null;
        s.pointerPos = null;
        s.levelTime = 0;
        s.waveIndex = 0;
        s.totalWaves = lvl.waves.length;
        s.isFinalWaveTriggered = false;
        s.score = 0;
        s.gameState = 'playing';

        setCroquetas(lvl.startingCroquetas);
        setSelectedCard(null);
        setIsShovelActive(false);
        setIsPlantFoodActive(false);
        setPlantFoodCount(2);
        setGameState('playing');
        setLevelProgress(0);
        setHugeWaveWarning(false);
        setScore(0);
        setLastRecordResult(null);

        DvmAudio.victory();
    }, [initLawnmowers]);

    // Handle Victory
    const handleLevelVictory = useCallback(() => {
        const s = stateRef.current;
        s.gameState = 'levelcleared';
        setGameState('levelcleared');
        DvmAudio.victory();

        const pts = 2000 + (currentLevelIdx + 1) * 1000 + s.croquetaBalance;
        s.score += pts;
        setScore(s.score);

        const res = recordScore('dogsvsmonsters', s.score);
        setLastRecordResult(res);
    }, [currentLevelIdx, recordScore]);

    // Handle Defeat
    const handleGameOver = useCallback(() => {
        const s = stateRef.current;
        s.gameState = 'gameover';
        setGameState('gameover');
        DvmAudio.defeat();
        addShake(18, 0.6);

        const res = recordScore('dogsvsmonsters', s.score);
        setLastRecordResult(res);
    }, [recordScore]);

    // Spawn Sun / Croqueta
    const spawnCroqueta = useCallback((x: number, y: number, targetY: number, value = 25, isGolden = false) => {
        stateRef.current.croquetas.push({
            id: crypto.randomUUID(),
            x,
            y,
            targetY,
            vx: (Math.random() - 0.5) * 30,
            vy: 85,
            value,
            life: 16.0,
            collected: false,
            isGolden,
            pulse: 0,
        });
    }, []);

    // Collect Croqueta
    const collectCroqueta = (croq: Croqueta) => {
        if (croq.collected) return;
        croq.collected = true;
        stateRef.current.croquetaBalance += croq.value;
        setCroquetas(stateRef.current.croquetaBalance);
        stateRef.current.score += croq.value * 2;
        setScore(stateRef.current.score);

        DvmAudio.croquetaCrunch();
        spawnParticles(croq.x, croq.y, croq.isGolden ? '#fde047' : '#fb923c', 16, 180, true);
        addFloatingText(croq.x, croq.y - 12, `+${croq.value} 🍖`, '#fde047');
    };

    // Plant Food Ultimate Action
    const triggerSuperCookieUltimate = (dog: PlacedDog) => {
        const s = stateRef.current;
        if (s.plantFoodCount <= 0) return;

        s.plantFoodCount--;
        setPlantFoodCount(s.plantFoodCount);
        dog.state = 'ultimate';
        dog.ultimateTimer = 3.5;
        DvmAudio.superCookie();
        addShake(10, 0.4);
        spawnParticles(
            GRID_START_X + dog.col * CELL_W + CELL_W / 2,
            GRID_START_Y + dog.row * CELL_H + CELL_H / 2,
            '#22c55e',
            35,
            240,
            true
        );

        if (dog.type === 'kiaro') {
            // Machine gun volley of 40 tennis balls
            for (let i = 0; i < 40; i++) {
                setTimeout(() => {
                    s.projectiles.push({
                        id: crypto.randomUUID(),
                        row: dog.row,
                        x: GRID_START_X + dog.col * CELL_W + CELL_W,
                        y: GRID_START_Y + dog.row * CELL_H + CELL_H / 2 + (Math.random() - 0.5) * 16,
                        vx: 780,
                        damage: 45,
                        isIce: false,
                        isSonic: i % 4 === 0,
                        isBig: i === 39,
                        trail: [],
                    });
                    DvmAudio.tennisShoot();
                }, i * 65);
            }
        } else if (dog.type === 'miel') {
            // Rain of 150 Croquetas + Heal all dogs
            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    spawnCroqueta(
                        GRID_START_X + Math.random() * (CELL_W * GRID_COLS),
                        0,
                        GRID_START_Y + Math.random() * (CELL_H * GRID_ROWS),
                        25,
                        true
                    );
                }, i * 180);
            }
            s.dogs.forEach(d => {
                d.hp = d.maxHp;
            });
            addFloatingText(GRID_START_X + dog.col * CELL_W + CELL_W / 2, GRID_START_Y + dog.row * CELL_H, '💖 CURACIÓN TOTAL!', '#f43f5e');
        } else if (dog.type === 'nika') {
            // Blizzard freezes entire row + big ice meteor
            s.enemies.forEach(e => {
                if (e.row === dog.row) {
                    e.isFrozen = 6.0;
                    e.isChilled = true;
                    e.hp -= 250;
                }
            });
            DvmAudio.iceFreeze();
            addFloatingText(GRID_START_X + dog.col * CELL_W, GRID_START_Y + dog.row * CELL_H, '❄️ VENTISCA POLAR!', '#00dbe9');
        } else if (dog.type === 'sam') {
            // Spiked Diamond Armor 8000 HP
            dog.hp = 8000;
            dog.maxHp = 8000;
            dog.isArmored = true;
            addFloatingText(GRID_START_X + dog.col * CELL_W, GRID_START_Y + dog.row * CELL_H, '🛡️ ARMADURA DE DIAMANTE!', '#a100f0');
        } else if (dog.type === 'boxerDog') {
            // 360 Whirlwind Punch
            s.enemies.forEach(e => {
                if (Math.abs(e.row - dog.row) <= 1 && Math.abs(e.x - (GRID_START_X + dog.col * CELL_W)) <= CELL_W * 1.8) {
                    e.hp -= 600;
                    spawnParticles(e.x, GRID_START_Y + e.row * CELL_H + CELL_H / 2, '#e11d48', 20, 200);
                }
            });
            DvmAudio.punch();
        }
    };

    // ── MAIN 60 FPS GAME LOOP ───────────────────────────────────────────────
    useEffect(() => {
        let animId: number;
        let lastTime = performance.now();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const loop = (time: number) => {
            const dt = Math.min((time - lastTime) / 1000, 0.05);
            lastTime = time;

            const s = stateRef.current;

            // Screen Shake
            if (s.shakeTime > 0) {
                s.shakeTime -= dt;
                if (s.shakeTime <= 0) s.shakeIntensity = 0;
            }

            // Update Cooldowns
            Object.keys(s.cooldowns).forEach(k => {
                const key = k as DogId;
                if (s.cooldowns[key] > 0) {
                    s.cooldowns[key] = Math.max(0, s.cooldowns[key] - dt);
                }
            });
            setCooldowns({ ...s.cooldowns });

            // ── 1. GAMEPLAY SIMULATION ──────────────────────────────────────
            if (s.gameState === 'playing') {
                s.levelTime += dt;

                // Update Level Progress Indicator
                const progressPct = Math.min(100, Math.round((s.levelTime / currentLevel.duration) * 100));
                setLevelProgress(progressPct);

                // Natural Croqueta Generation from Sky
                s.nextNaturalCroquetaTimer -= dt;
                if (s.nextNaturalCroquetaTimer <= 0) {
                    s.nextNaturalCroquetaTimer = 7.5 + Math.random() * 3.5;
                    const spawnX = GRID_START_X + 40 + Math.random() * (GRID_COLS * CELL_W - 80);
                    const targetY = GRID_START_Y + 50 + Math.random() * (GRID_ROWS * CELL_H - 100);
                    spawnCroqueta(spawnX, 0, targetY, 25, false);
                }

                // Wave Spawner
                currentLevel.waves.forEach((w, idx) => {
                    if (s.levelTime >= w.time && s.waveIndex === idx) {
                        s.waveIndex = idx + 1;

                        if (w.isHugeWave) {
                            setHugeWaveWarning(true);
                            DvmAudio.hugeWave();
                            addShake(14, 0.6);
                            setTimeout(() => setHugeWaveWarning(false), 3500);
                        }

                        w.enemies.forEach((enemyDef, i) => {
                            const enemyTmpl = ENEMY_CATALOG[enemyDef.type];
                            const assignedRow = enemyDef.row !== undefined ? enemyDef.row : Math.floor(Math.random() * GRID_ROWS);

                            setTimeout(() => {
                                s.enemies.push({
                                    id: crypto.randomUUID(),
                                    type: enemyDef.type,
                                    name: enemyTmpl.name,
                                    row: assignedRow,
                                    x: V_WIDTH + 40,
                                    speed: enemyTmpl.speed,
                                    baseSpeed: enemyTmpl.speed,
                                    hp: enemyTmpl.hp,
                                    maxHp: enemyTmpl.hp,
                                    damage: enemyTmpl.damage,
                                    attackInterval: enemyTmpl.attackInterval,
                                    attackTimer: 0,
                                    state: 'walking',
                                    isFrozen: 0,
                                    isChilled: false,
                                    hasJumped: false,
                                    armorHp: enemyTmpl.armorHp,
                                    maxArmorHp: enemyTmpl.armorHp,
                                    specialTimer: 0,
                                    animFrame: 0,
                                    color: enemyTmpl.color,
                                    hasSuperCookieDrop: enemyDef.hasCookie,
                                });
                            }, i * 350);
                        });
                    }
                });

                // Check Victory (All waves spawned and all enemies defeated)
                if (s.waveIndex >= currentLevel.waves.length && s.enemies.length === 0) {
                    handleLevelVictory();
                }

                // Update Dogs
                s.dogs.forEach(dog => {
                    dog.animFrame += dt * 4;

                    // Ultimate timer
                    if (dog.ultimateTimer && dog.ultimateTimer > 0) {
                        dog.ultimateTimer -= dt;
                        if (dog.ultimateTimer <= 0) dog.state = 'idle';
                    }

                    // Potato Mine Arming
                    if (dog.type === 'boneMine' && dog.state === 'arming') {
                        dog.actionTimer += dt;
                        if (dog.actionTimer >= 10.0) {
                            dog.state = 'armed';
                            DvmAudio.mineArmed();
                            spawnParticles(
                                GRID_START_X + dog.col * CELL_W + CELL_W / 2,
                                GRID_START_Y + dog.row * CELL_H + CELL_H / 2,
                                '#fbbf24',
                                14,
                                120
                            );
                        }
                    }

                    // Miel Croqueta Production (Produces every 14s)
                    if (dog.type === 'miel' && !dog.bubbleTrapped) {
                        dog.actionTimer += dt;
                        if (dog.actionTimer >= 14.0) {
                            dog.actionTimer = 0;
                            const cx = GRID_START_X + dog.col * CELL_W + CELL_W / 2;
                            const cy = GRID_START_Y + dog.row * CELL_H + CELL_H / 2;
                            spawnCroqueta(cx, cy - 20, cy + 25, 25, true);
                            spawnParticles(cx, cy, '#fde047', 12, 100, true);
                        }
                    }

                    // Shooters (Kiaro & Nika)
                    if ((dog.type === 'kiaro' || dog.type === 'nika') && !dog.bubbleTrapped && dog.state !== 'ultimate') {
                        const hasEnemyAhead = s.enemies.some(
                            e => e.row === dog.row && e.x > GRID_START_X + dog.col * CELL_W && e.x < V_WIDTH
                        );

                        if (hasEnemyAhead) {
                            dog.actionTimer += dt;
                            const interval = dog.type === 'kiaro' ? 1.4 : 1.5;
                            if (dog.actionTimer >= interval) {
                                dog.actionTimer = 0;
                                const isIce = dog.type === 'nika';
                                s.projectiles.push({
                                    id: crypto.randomUUID(),
                                    row: dog.row,
                                    x: GRID_START_X + dog.col * CELL_W + CELL_W - 10,
                                    y: GRID_START_Y + dog.row * CELL_H + CELL_H / 2,
                                    vx: 380,
                                    damage: isIce ? 25 : 30,
                                    isIce,
                                    isSonic: false,
                                    isBig: false,
                                    trail: [],
                                });

                                if (isIce) DvmAudio.iceShoot();
                                else DvmAudio.tennisShoot();
                            }
                        }
                    }

                    // Boxer Dog Melee
                    if (dog.type === 'boxerDog' && !dog.bubbleTrapped && dog.state !== 'ultimate') {
                        const targetEnemy = s.enemies.find(
                            e => e.row === dog.row && Math.abs(e.x - (GRID_START_X + dog.col * CELL_W + CELL_W / 2)) < CELL_W * 1.2
                        );
                        if (targetEnemy) {
                            dog.actionTimer += dt;
                            if (dog.actionTimer >= 0.7) {
                                dog.actionTimer = 0;
                                targetEnemy.hp -= 45;
                                DvmAudio.punch();
                                spawnParticles(targetEnemy.x, GRID_START_Y + dog.row * CELL_H + CELL_H / 2, '#e11d48', 8, 120);
                            }
                        }
                    }
                });

                // Update Projectiles
                for (let i = s.projectiles.length - 1; i >= 0; i--) {
                    const pr = s.projectiles[i];
                    pr.x += pr.vx * dt;

                    pr.trail.unshift({ x: pr.x, y: pr.y });
                    if (pr.trail.length > 5) pr.trail.pop();

                    // Check collision with enemies on the same row
                    for (let j = s.enemies.length - 1; j >= 0; j--) {
                        const e = s.enemies[j];
                        if (e.row === pr.row && e.x <= pr.x + 18 && e.x >= pr.x - 30) {
                            if (e.type === 'vacuum_monster' && e.hp > 0 && Math.random() < 0.25) {
                                DvmAudio.punch();
                                addFloatingText(e.x, GRID_START_Y + e.row * CELL_H, '🌪️ ABSORBIDO!', '#94a3b8');
                                s.projectiles.splice(i, 1);
                                break;
                            }

                            if (e.armorHp && e.armorHp > 0) {
                                e.armorHp -= pr.damage;
                                if (e.armorHp <= 0) {
                                    spawnParticles(e.x, GRID_START_Y + e.row * CELL_H + CELL_H / 2, '#d97706', 18, 180);
                                    addFloatingText(e.x, GRID_START_Y + e.row * CELL_H, '📦 CAJA ROTA!', '#f59e0b');
                                }
                            } else {
                                e.hp -= pr.damage;
                            }

                            DvmAudio.enemyHit();
                            spawnParticles(pr.x, pr.y, pr.isIce ? '#00dbe9' : '#facc15', 6, 120, false, false, pr.isIce);

                            if (pr.isIce) {
                                e.isFrozen = 4.0;
                                e.isChilled = true;
                            }

                            if (pr.isSonic) {
                                e.x += 35;
                                DvmAudio.sonicBark();
                            }

                            if (e.hp <= 0) {
                                DvmAudio.explosion();
                                spawnParticles(e.x, GRID_START_Y + e.row * CELL_H + CELL_H / 2, e.color, 24, 200);

                                if (e.hasSuperCookieDrop) {
                                    s.plantFoodCount = Math.min(3, s.plantFoodCount + 1);
                                    setPlantFoodCount(s.plantFoodCount);
                                    addFloatingText(e.x, GRID_START_Y + e.row * CELL_H, '+1 SUPER GALLETA 🍪!', '#22c55e');
                                    DvmAudio.superCookie();
                                }

                                s.score += 150;
                                setScore(s.score);
                                s.enemies.splice(j, 1);
                            }

                            s.projectiles.splice(i, 1);
                            break;
                        }
                    }

                    if (pr.x > V_WIDTH + 40) {
                        s.projectiles.splice(i, 1);
                    }
                }

                // Update Enemies
                for (let i = s.enemies.length - 1; i >= 0; i--) {
                    const e = s.enemies[i];
                    e.animFrame += dt * 5;

                    if (e.isFrozen > 0) {
                        e.isFrozen -= dt;
                        e.speed = e.baseSpeed * 0.5;
                        if (e.isFrozen <= 0) e.isChilled = false;
                    } else {
                        e.speed = e.baseSpeed;
                    }

                    const dogInCell = s.dogs.find(d => d.row === e.row && Math.abs(GRID_START_X + d.col * CELL_W + CELL_W / 2 - e.x) < 32);

                    if (dogInCell) {
                        if (e.type === 'cat_ninja' && !e.hasJumped && dogInCell.type !== 'sam') {
                            e.hasJumped = true;
                            e.x -= CELL_W * 1.2;
                            DvmAudio.sonicBark();
                            addFloatingText(e.x, GRID_START_Y + e.row * CELL_H, '🥷 SALTO NINJA!', '#a5b4fc');
                            continue;
                        }

                        if (dogInCell.type === 'boneMine' && dogInCell.state === 'armed') {
                            DvmAudio.explosion();
                            addShake(12, 0.4);
                            spawnParticles(e.x, GRID_START_Y + e.row * CELL_H + CELL_H / 2, '#fbbf24', 40, 260, true);
                            e.hp -= 1800;

                            const mineIdx = s.dogs.indexOf(dogInCell);
                            if (mineIdx !== -1) s.dogs.splice(mineIdx, 1);

                            if (e.hp <= 0) {
                                s.enemies.splice(i, 1);
                            }
                            continue;
                        }

                        if (e.type === 'bath_groomer') {
                            e.specialTimer = (e.specialTimer || 0) + dt;
                            if (e.specialTimer >= 4.0) {
                                e.specialTimer = 0;
                                dogInCell.bubbleTrapped = true;
                                addFloatingText(dogInCell.col * CELL_W, GRID_START_Y + dogInCell.row * CELL_H, '🧼 ¡BURBUJA!', '#67e8f9');
                            }
                        }

                        e.state = 'attacking';
                        e.attackTimer += dt;
                        if (e.attackTimer >= e.attackInterval) {
                            e.attackTimer = 0;
                            dogInCell.hp -= e.damage;
                            DvmAudio.punch();
                            spawnParticles(e.x, GRID_START_Y + e.row * CELL_H + CELL_H / 2, '#f43f5e', 5, 80);

                            if (dogInCell.hp <= 0) {
                                const idx = s.dogs.indexOf(dogInCell);
                                if (idx !== -1) s.dogs.splice(idx, 1);
                                e.state = 'walking';
                            }
                        }
                    } else {
                        e.state = 'walking';
                        e.x -= e.speed * dt;
                    }

                    // Lawnmower / Emergency Cart Check
                    if (e.x <= GRID_START_X - 10) {
                        const mower = s.lawnmowers.find(m => m.row === e.row);
                        if (mower && mower.active && !mower.triggered) {
                            mower.triggered = true;
                            DvmAudio.lawnmower();
                            addShake(10, 0.4);
                        } else if (!mower || !mower.active) {
                            handleGameOver();
                            return;
                        }
                    }
                }

                // Update Lawnmowers (Emergency Carts)
                s.lawnmowers.forEach(m => {
                    if (m.triggered && m.active) {
                        m.x += 620 * dt;
                        spawnParticles(m.x, GRID_START_Y + m.row * CELL_H + CELL_H / 2, '#f59e0b', 8, 140);

                        s.enemies.forEach(e => {
                            if (e.row === m.row && Math.abs(e.x - m.x) < 45) {
                                e.hp = 0;
                                spawnParticles(e.x, GRID_START_Y + e.row * CELL_H + CELL_H / 2, '#ef4444', 30, 240);
                            }
                        });
                        s.enemies = s.enemies.filter(e => e.hp > 0);

                        if (m.x > V_WIDTH + 60) {
                            m.active = false;
                        }
                    }
                });

                // Update Croquetas (Suns)
                for (let i = s.croquetas.length - 1; i >= 0; i--) {
                    const c = s.croquetas[i];
                    c.pulse += dt * 5;

                    if (c.y < c.targetY) {
                        c.y += c.vy * dt;
                        c.x += Math.sin(c.pulse) * 0.8;
                    } else {
                        c.life -= dt;
                        if (c.life <= 0) {
                            s.croquetas.splice(i, 1);
                        }
                    }
                }
            }

            // Update Particles
            for (let i = s.particles.length - 1; i >= 0; i--) {
                const pt = s.particles[i];
                pt.life += dt;
                pt.x += pt.vx * dt;
                pt.y += pt.vy * dt;
                pt.alpha = Math.max(0, 1 - pt.life / pt.maxLife);
                if (pt.life >= pt.maxLife) {
                    s.particles.splice(i, 1);
                }
            }

            // Update Floating Texts
            for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
                const ft = s.floatingTexts[i];
                ft.y -= 28 * dt;
                ft.life -= dt;
                if (ft.life <= 0) s.floatingTexts.splice(i, 1);
            }

            // ── 2. RENDER SCENE ──────────────────────────────────────────────
            ctx.save();
            ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

            if (s.shakeIntensity > 0) {
                const ox = (Math.random() * 2 - 1) * s.shakeIntensity;
                const oy = (Math.random() * 2 - 1) * s.shakeIntensity;
                ctx.translate(ox, oy);
            }

            // 1. Backyard Grass Background
            const bgGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
            bgGrad.addColorStop(0, '#14532d');
            bgGrad.addColorStop(1, '#052e16');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // 2. Render 5x9 Lawn Grid Cells
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    const cellX = GRID_START_X + c * CELL_W;
                    const cellY = GRID_START_Y + r * CELL_H;
                    const isEven = (r + c) % 2 === 0;

                    ctx.fillStyle = isEven ? 'rgba(34, 197, 94, 0.15)' : 'rgba(22, 163, 74, 0.08)';
                    ctx.fillRect(cellX, cellY, CELL_W - 2, CELL_H - 2);

                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(cellX, cellY, CELL_W - 2, CELL_H - 2);
                }
            }

            // Highlight Hover Grid with Ghost Preview
            if (s.hoverGrid && s.selectedCard) {
                const hx = GRID_START_X + s.hoverGrid.col * CELL_W;
                const hy = GRID_START_Y + s.hoverGrid.row * CELL_H;
                const card = DOG_CATALOG[s.selectedCard];
                const isOccupied = s.dogs.some(d => d.row === s.hoverGrid!.row && d.col === s.hoverGrid!.col);
                const canAfford = s.croquetaBalance >= card.cost && s.cooldowns[s.selectedCard] <= 0;

                ctx.save();
                if (isOccupied || !canAfford) {
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
                    ctx.strokeStyle = '#ef4444';
                } else {
                    ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
                    ctx.strokeStyle = '#22c55e';
                }
                ctx.lineWidth = 2.5;
                ctx.fillRect(hx, hy, CELL_W - 2, CELL_H - 2);
                ctx.strokeRect(hx, hy, CELL_W - 2, CELL_H - 2);

                // Ghost icon preview
                ctx.globalAlpha = 0.65;
                ctx.font = '28px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(card.icon, hx + CELL_W / 2, hy + CELL_H / 2);
                ctx.restore();
            }

            // 3. Render Lawnmowers (Puppy Ride-On Kids Carts)
            const CART_THEMES = [
                { body: '#ef4444', roof: '#facc15', bumper: '#b91c1c', puppy: '🐶', name: 'Kiaro Jr.' },
                { body: '#ec4899', roof: '#fdf2f8', bumper: '#be185d', puppy: '🍯', name: 'Miel Jr.' },
                { body: '#0284c7', roof: '#38bdf8', bumper: '#0369a1', puppy: '❄️', name: 'Nika Jr.' },
                { body: '#8b5cf6', roof: '#facc15', bumper: '#6d28d9', puppy: '🛡️', name: 'Sam Jr.' },
                { body: '#84cc16', roof: '#fb923c', bumper: '#4d7c0f', puppy: '⭐', name: 'Star Jr.' },
            ];

            s.lawnmowers.forEach(m => {
                if (m.active) {
                    ctx.save();
                    const theme = CART_THEMES[m.row % CART_THEMES.length];
                    const centerY = GRID_START_Y + m.row * CELL_H + CELL_H / 2;
                    const idleBounce = m.triggered ? 0 : Math.sin(time * 0.005 + m.row) * 1.8;
                    const tilt = m.triggered ? 0.08 : 0;

                    ctx.translate(m.x, centerY + idleBounce);
                    ctx.rotate(tilt);

                    // 1. Headlight beam when rushing down the lane
                    if (m.triggered) {
                        const lightGrad = ctx.createRadialGradient(25, 0, 5, 95, 0, 75);
                        lightGrad.addColorStop(0, 'rgba(253, 224, 71, 0.65)');
                        lightGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
                        ctx.fillStyle = lightGrad;
                        ctx.beginPath();
                        ctx.moveTo(25, -12);
                        ctx.lineTo(140, -38);
                        ctx.lineTo(140, 38);
                        ctx.lineTo(25, 12);
                        ctx.closePath();
                        ctx.fill();
                    }

                    // 2. Drop Shadow
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                    ctx.beginPath();
                    ctx.ellipse(0, 18, 28, 8, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // 3. Car Back Wheels
                    const wheelRot = m.triggered ? (time * 0.035) : 0;
                    ctx.save();
                    ctx.translate(-15, 14);
                    ctx.rotate(wheelRot);
                    ctx.fillStyle = '#0f172a';
                    ctx.beginPath();
                    ctx.arc(0, 0, 9, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#facc15';
                    ctx.beginPath();
                    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();

                    // 4. Ride-On Car Body (Rounded Plastic Pod)
                    const bodyGrad = ctx.createLinearGradient(-24, -12, 24, 18);
                    bodyGrad.addColorStop(0, theme.body);
                    bodyGrad.addColorStop(1, theme.bumper);
                    ctx.fillStyle = bodyGrad;
                    ctx.shadowColor = theme.body;
                    ctx.shadowBlur = m.triggered ? 16 : 6;
                    ctx.beginPath();
                    ctx.roundRect(-24, -10, 48, 25, [8, 14, 8, 8]);
                    ctx.fill();

                    // Front Grille & Bright Headlight
                    ctx.fillStyle = '#fef08a';
                    ctx.shadowColor = '#fef08a';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(22, -2, 5.5, 0, Math.PI * 2);
                    ctx.fill();

                    // 5. Canopy Roof & Safety Pillars
                    ctx.fillStyle = theme.roof;
                    ctx.shadowColor = 'transparent';
                    ctx.beginPath();
                    ctx.roundRect(-18, -28, 36, 12, [7, 7, 3, 3]);
                    ctx.fill();

                    ctx.strokeStyle = theme.roof;
                    ctx.lineWidth = 3.5;
                    ctx.beginPath();
                    ctx.moveTo(-13, -16);
                    ctx.lineTo(-13, -10);
                    ctx.moveTo(13, -16);
                    ctx.lineTo(13, -10);
                    ctx.stroke();

                    // 6. Cute Puppy Driver Inside Cabin
                    ctx.save();
                    ctx.translate(0, -15);
                    ctx.font = '20px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(theme.puppy, 0, 0);

                    // Steering Wheel with Horn
                    ctx.fillStyle = '#0f172a';
                    ctx.beginPath();
                    ctx.roundRect(5, 5, 8, 4, 2);
                    ctx.fill();
                    ctx.fillStyle = '#facc15';
                    ctx.beginPath();
                    ctx.arc(9, 7, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();

                    // 7. Front Wheel
                    ctx.save();
                    ctx.translate(15, 14);
                    ctx.rotate(wheelRot);
                    ctx.fillStyle = '#0f172a';
                    ctx.beginPath();
                    ctx.arc(0, 0, 9, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#facc15';
                    ctx.beginPath();
                    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();

                    // 8. Bouncy Antenna with Racing Ball
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.lineWidth = 1.5;
                    const antBounce = Math.sin(time * 0.008 + m.row) * 3.5;
                    ctx.beginPath();
                    ctx.moveTo(-20, -8);
                    ctx.lineTo(-26, -30 + antBounce);
                    ctx.stroke();

                    ctx.fillStyle = '#f59e0b';
                    ctx.shadowColor = '#f59e0b';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(-26, -30 + antBounce, 3.5, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.restore();
                }
            });

            // 4. Render Placed Dogs
            s.dogs.forEach(dog => {
                const cx = GRID_START_X + dog.col * CELL_W + CELL_W / 2;
                const cy = GRID_START_Y + dog.row * CELL_H + CELL_H / 2;
                const bob = Math.sin(dog.animFrame) * 3;

                ctx.save();
                ctx.translate(cx, cy + bob);

                if (dog.state === 'ultimate') {
                    ctx.shadowColor = '#22c55e';
                    ctx.shadowBlur = 24;
                    ctx.strokeStyle = '#22c55e';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0, 0, 34, 0, Math.PI * 2);
                    ctx.stroke();
                }

                if (dog.isArmored) {
                    ctx.strokeStyle = '#fde047';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0, 0, 36, 0, Math.PI * 2);
                    ctx.stroke();
                }

                const catalogItem = DOG_CATALOG[dog.type];
                ctx.fillStyle = catalogItem.accentColor + '35';
                ctx.strokeStyle = catalogItem.accentColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 26, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.font = '28px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(catalogItem.icon, 0, 2);

                if (dog.type === 'boneMine' && dog.state === 'armed') {
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(0, -28, 5, 0, Math.PI * 2);
                    ctx.fill();
                }

                if (dog.bubbleTrapped) {
                    ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
                    ctx.strokeStyle = '#67e8f9';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0, 0, 32, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }

                if (dog.hp < dog.maxHp) {
                    const barW = 40;
                    const hpRatio = Math.max(0, dog.hp / dog.maxHp);
                    ctx.fillStyle = 'rgba(0,0,0,0.6)';
                    ctx.fillRect(-barW / 2, 28, barW, 4);
                    ctx.fillStyle = '#22c55e';
                    ctx.fillRect(-barW / 2, 28, barW * hpRatio, 4);
                }

                ctx.restore();
            });

            // 5. Render Projectiles (Tennis Balls & Ice Frisbees)
            s.projectiles.forEach(pr => {
                ctx.save();

                pr.trail.forEach((t, i) => {
                    ctx.fillStyle = pr.isIce
                        ? `rgba(0, 219, 233, ${0.4 * (1 - i / pr.trail.length)})`
                        : `rgba(250, 204, 21, ${0.4 * (1 - i / pr.trail.length)})`;
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, 4 * (1 - i / pr.trail.length), 0, Math.PI * 2);
                    ctx.fill();
                });

                if (pr.isIce) {
                    ctx.fillStyle = '#00dbe9';
                    ctx.shadowColor = '#00dbe9';
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.arc(pr.x, pr.y, pr.isBig ? 14 : 7, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = pr.isSonic ? '#ff7020' : '#a3e635';
                    ctx.shadowColor = pr.isSonic ? '#ff7020' : '#a3e635';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(pr.x, pr.y, pr.isBig ? 16 : 8, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(pr.x, pr.y, pr.isBig ? 12 : 6, -0.8, 0.8);
                    ctx.stroke();
                }
                ctx.restore();
            });

            // 6. Render Enemies
            s.enemies.forEach(e => {
                const cy = GRID_START_Y + e.row * CELL_H + CELL_H / 2;
                const bob = Math.sin(e.animFrame) * 4;

                ctx.save();
                ctx.translate(e.x, cy + bob);

                if (e.isChilled) {
                    ctx.shadowColor = '#00dbe9';
                    ctx.shadowBlur = 14;
                }

                ctx.fillStyle = e.isChilled ? '#0284c7' : '#1e1b4b';
                ctx.strokeStyle = e.color;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, 0, e.type === 'boss_mecha_cat' ? 44 : 26, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                const tmpl = ENEMY_CATALOG[e.type];
                ctx.font = e.type === 'boss_mecha_cat' ? '44px sans-serif' : '26px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(tmpl.icon, 0, 2);

                if (e.armorHp && e.armorHp > 0) {
                    ctx.fillStyle = '#b45309';
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.roundRect(-16, -34, 32, 20, 4);
                    ctx.fill();
                    ctx.stroke();
                }

                if (e.hasSuperCookieDrop) {
                    ctx.fillStyle = '#22c55e';
                    ctx.font = '12px monospace';
                    ctx.fillText('🍪', 0, -32);
                }

                const barW = 44;
                const hpRatio = Math.max(0, e.hp / e.maxHp);
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(-barW / 2, 28, barW, 4);
                ctx.fillStyle = e.type === 'boss_mecha_cat' ? '#ec4899' : '#ef4444';
                ctx.fillRect(-barW / 2, 28, barW * hpRatio, 4);

                ctx.restore();
            });

            // 7. Render Croquetas (Suns)
            s.croquetas.forEach(c => {
                ctx.save();
                ctx.translate(c.x, c.y);

                const scale = 1.0 + Math.sin(c.pulse) * 0.14;
                ctx.scale(scale, scale);

                // Radiant Sun Halo
                ctx.fillStyle = c.isGolden ? 'rgba(253, 224, 71, 0.45)' : 'rgba(251, 146, 60, 0.45)';
                ctx.beginPath();
                ctx.arc(0, 0, 26, 0, Math.PI * 2);
                ctx.fill();

                // Golden Croqueta Bowl
                ctx.fillStyle = c.isGolden ? '#facc15' : '#fb923c';
                ctx.shadowColor = c.isGolden ? '#facc15' : '#fb923c';
                ctx.shadowBlur = 16;
                ctx.beginPath();
                ctx.arc(0, 0, 18, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000000';
                ctx.font = '18px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🍖', 0, 0);
                ctx.restore();
            });

            // 8. Render Particles & Floating Texts
            s.particles.forEach(pt => {
                ctx.save();
                ctx.globalAlpha = pt.alpha;
                ctx.fillStyle = pt.color;
                ctx.shadowColor = pt.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            s.floatingTexts.forEach(ft => {
                ctx.save();
                ctx.font = 'bold 14px monospace';
                ctx.fillStyle = ft.color;
                ctx.shadowColor = ft.color;
                ctx.shadowBlur = 10;
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            });

            ctx.restore();
            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [currentLevel, handleLevelVictory, handleGameOver, spawnCroqueta]);

    // Pointer Move (Calculates hover cell + Auto-Collect Croquetas on sweep)
    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoordinates(e);
        if (!coords || stateRef.current.gameState !== 'playing') return;

        stateRef.current.pointerPos = coords;

        // Auto-collect any croqueta touched by cursor/finger (60px radius)
        const s = stateRef.current;
        for (let i = s.croquetas.length - 1; i >= 0; i--) {
            const c = s.croquetas[i];
            if (!c.collected && Math.hypot(c.x - coords.x, c.y - coords.y) < 60) {
                collectCroqueta(c);
            }
        }

        // Calculate grid hover
        const col = Math.floor((coords.x - GRID_START_X) / CELL_W);
        const row = Math.floor((coords.y - GRID_START_Y) / CELL_H);

        if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
            stateRef.current.hoverGrid = { row, col };
        } else {
            stateRef.current.hoverGrid = null;
        }
    };

    // Pointer Down Interaction (Instant click & touch response)
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoordinates(e);
        if (!coords || stateRef.current.gameState !== 'playing') return;

        const s = stateRef.current;

        // 1. Direct Croqueta Click (Generous 65px radius)
        for (let i = s.croquetas.length - 1; i >= 0; i--) {
            const c = s.croquetas[i];
            if (!c.collected && Math.hypot(c.x - coords.x, c.y - coords.y) < 65) {
                collectCroqueta(c);
                return; // Consumed by croqueta collection (do not plant behind it)
            }
        }

        // Calculate clicked row and col
        const col = Math.floor((coords.x - GRID_START_X) / CELL_W);
        const row = Math.floor((coords.y - GRID_START_Y) / CELL_H);

        if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) {
            // Clicked outside grid -> cancel selection
            selectCardAction(null);
            setIsShovelActive(false);
            s.isShovelActive = false;
            setIsPlantFoodActive(false);
            s.isPlantFoodActive = false;
            return;
        }

        const existingDog = s.dogs.find(d => d.row === row && d.col === col);

        // 2. Bubble Pop Click
        if (existingDog && existingDog.bubbleTrapped) {
            existingDog.bubbleTrapped = false;
            DvmAudio.punch();
            spawnParticles(coords.x, coords.y, '#67e8f9', 16, 160);
            addFloatingText(coords.x, coords.y, 'POP! 🧼', '#67e8f9');
            return;
        }

        // 3. Super-Cookie (Plant Food) on Dog
        if (s.isPlantFoodActive && existingDog) {
            triggerSuperCookieUltimate(existingDog);
            setIsPlantFoodActive(false);
            s.isPlantFoodActive = false;
            return;
        }

        // 4. Shovel on Dog
        if (s.isShovelActive && existingDog) {
            const idx = s.dogs.indexOf(existingDog);
            if (idx !== -1) s.dogs.splice(idx, 1);
            DvmAudio.shovel();
            spawnParticles(coords.x, coords.y, '#fbbf24', 12, 120);
            setIsShovelActive(false);
            s.isShovelActive = false;
            return;
        }

        // 5. Plant Dog from Selected Card
        const currentCard = s.selectedCard;
        if (currentCard) {
            if (existingDog) {
                // Occupied feedback
                DvmAudio.buzzer();
                addFloatingText(coords.x, coords.y, '¡Casilla Ocupada! ❌', '#ef4444');
                return;
            }

            const card = DOG_CATALOG[currentCard];
            if (s.croquetaBalance >= card.cost && s.cooldowns[currentCard] <= 0) {
                s.croquetaBalance -= card.cost;
                setCroquetas(s.croquetaBalance);
                s.cooldowns[currentCard] = card.cooldown;

                s.dogs.push({
                    id: crypto.randomUUID(),
                    type: currentCard,
                    row,
                    col,
                    hp: card.hp,
                    maxHp: card.hp,
                    actionTimer: 0,
                    actionInterval: 1.5,
                    animFrame: 0,
                    state: currentCard === 'boneMine' ? 'arming' : 'idle',
                });

                DvmAudio.plantDog();
                spawnParticles(coords.x, coords.y, card.accentColor, 18, 160);
                addFloatingText(coords.x, coords.y - 10, `+${card.name}!`, card.accentColor);

                // Instant Love Bomb Explosion
                if (currentCard === 'loveBomb') {
                    setTimeout(() => {
                        const bombDog = s.dogs.find(d => d.row === row && d.col === col && d.type === 'loveBomb');
                        if (bombDog) {
                            DvmAudio.explosion();
                            addShake(14, 0.4);
                            spawnParticles(coords.x, coords.y, '#f43f5e', 45, 280, false, true);

                            // 3x3 Damage
                            s.enemies.forEach(e => {
                                if (Math.abs(e.row - row) <= 1 && Math.abs(e.x - (GRID_START_X + col * CELL_W + CELL_W / 2)) <= CELL_W * 1.6) {
                                    e.hp -= 1800;
                                }
                            });
                            s.enemies = s.enemies.filter(e => e.hp > 0);

                            const bIdx = s.dogs.indexOf(bombDog);
                            if (bIdx !== -1) s.dogs.splice(bIdx, 1);
                        }
                    }, 800);
                }

                // Clear selection after successful plant
                selectCardAction(null);
            } else {
                DvmAudio.buzzer();
                if (s.croquetaBalance < card.cost) {
                    addFloatingText(coords.x, coords.y, '¡Faltan Croquetas! 🍖', '#f87171');
                } else {
                    addFloatingText(coords.x, coords.y, '¡Recargando! ⏳', '#facc15');
                }
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative h-[75vh] max-h-[860px] min-h-[560px] w-full overflow-hidden rounded-3xl border border-white/20 bg-slate-950 shadow-[0_24px_70px_rgba(0,0,0,0.85)] select-none font-mono touch-none"
        >
            <canvas
                ref={canvasRef}
                width={V_WIDTH}
                height={V_HEIGHT}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                className="absolute inset-0 h-full w-full block object-contain select-none cursor-pointer touch-none"
            />

            {/* Top Deck & Cards Selector HUD */}
            <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* Croqueta Balance Counter */}
                    <div className="flex items-center gap-2 bg-black/85 border border-amber-500/60 px-3.5 py-1.5 rounded-2xl shadow-[0_0_15px_rgba(251,191,36,0.4)] backdrop-blur-md">
                        <span className="text-xl animate-bounce">🍖</span>
                        <div>
                            <div className="text-[8px] uppercase tracking-widest text-amber-400 font-bold">CROQUETAS</div>
                            <div className="text-lg font-black text-white tabular-nums">{croquetas}</div>
                        </div>
                    </div>

                    {/* Dog Cards Tray */}
                    <div className="flex items-center gap-1.5 bg-black/75 border border-white/20 p-1 rounded-2xl backdrop-blur-md">
                        {currentLevel.availableDogs.map(dogId => {
                            const card = DOG_CATALOG[dogId];
                            const cd = cooldowns[dogId] || 0;
                            const isReady = croquetas >= card.cost && cd <= 0;
                            const isSelected = selectedCard === dogId;

                            return (
                                <button
                                    key={dogId}
                                    onClick={() => {
                                        if (isReady) {
                                            selectCardAction(isSelected ? null : dogId);
                                        } else {
                                            DvmAudio.buzzer();
                                        }
                                    }}
                                    className={`relative flex flex-col items-center justify-center w-12 sm:w-14 h-14 rounded-xl border transition-all ${
                                        isSelected
                                            ? 'border-yellow-400 bg-yellow-950/60 scale-105 shadow-[0_0_16px_rgba(250,204,21,0.8)] ring-2 ring-yellow-400'
                                            : isReady
                                            ? 'border-white/30 bg-slate-900/80 hover:bg-slate-800 active:scale-95'
                                            : 'border-white/10 bg-black/60 opacity-50'
                                    }`}
                                    title={`${card.name}: ${card.description}`}
                                >
                                    <span className="text-xl sm:text-2xl">{card.icon}</span>
                                    <span className="text-[10px] font-black text-amber-300">{card.cost}</span>

                                    {/* Cooldown Overlay */}
                                    {cd > 0 && (
                                        <div
                                            className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center text-[10px] font-black text-white"
                                        >
                                            {Math.ceil(cd)}s
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Shovel Tool */}
                    <button
                        onClick={() => {
                            const next = !isShovelActive;
                            setIsShovelActive(next);
                            stateRef.current.isShovelActive = next;
                            selectCardAction(null);
                            setIsPlantFoodActive(false);
                            stateRef.current.isPlantFoodActive = false;
                        }}
                        className={`p-2.5 border rounded-2xl transition-all shadow-lg ${
                            isShovelActive ? 'border-red-500 bg-red-950/70 text-red-300 ring-2 ring-red-500' : 'border-white/20 bg-black/80 text-white/70'
                        }`}
                        title="Palita de Reubicación (Desenterrar perrito)"
                    >
                        <span className="text-lg">铲</span>
                    </button>

                    {/* Plant Food Super Cookie */}
                    <button
                        onClick={() => {
                            if (plantFoodCount > 0) {
                                const next = !isPlantFoodActive;
                                setIsPlantFoodActive(next);
                                stateRef.current.isPlantFoodActive = next;
                                selectCardAction(null);
                                setIsShovelActive(false);
                                stateRef.current.isShovelActive = false;
                            }
                        }}
                        className={`px-3 py-1.5 border rounded-2xl transition-all shadow-lg flex items-center gap-1.5 ${
                            isPlantFoodActive
                                ? 'border-green-400 bg-green-950/70 text-green-300 ring-2 ring-green-400 animate-pulse'
                                : plantFoodCount > 0
                                ? 'border-green-500/50 bg-black/80 text-green-400'
                                : 'border-white/10 bg-black/40 text-white/30'
                        }`}
                        title="Super Galleta Nutritiva (Plant Food Ultimate)"
                    >
                        <span className="text-lg">🍪</span>
                        <span className="text-xs font-black">x{plantFoodCount}</span>
                    </button>
                </div>

                {/* Level Title & Controls */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="bg-black/85 border border-white/20 px-3 py-1.5 rounded-2xl text-right backdrop-blur-md">
                        <div className="text-[8px] uppercase tracking-widest text-white/50 font-bold">NIVEL {currentLevel.levelNumber}</div>
                        <div className="text-xs font-black text-cyan-300">{score} PTS</div>
                    </div>

                    <button
                        onClick={toggleMute}
                        className="p-2 bg-black/80 border border-white/20 rounded-2xl text-white hover:bg-white/10 transition-all shadow-lg"
                        title={mutedState ? 'Activar sonido' : 'Silenciar'}
                    >
                        {mutedState ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                    </button>
                </div>
            </div>

            {/* Wave Progress Bar */}
            <div className="absolute top-20 left-4 right-4 z-10 pointer-events-none">
                <div className="flex items-center justify-between text-[9px] text-white/70 font-bold mb-1">
                    <span>PROGRESS</span>
                    <span>{levelProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/80 border border-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-yellow-400 transition-all duration-200 shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                        style={{ width: `${levelProgress}%` }}
                    />
                </div>
            </div>

            {/* Huge Wave Warning Banner */}
            {hugeWaveWarning && (
                <div className="absolute inset-x-0 top-1/3 z-30 flex items-center justify-center pointer-events-none">
                    <div className="bg-red-950/90 border-y-4 border-red-500 py-3 px-6 text-center shadow-[0_0_40px_rgba(239,68,68,0.8)] animate-pulse">
                        <div className="text-xs font-black text-yellow-300 tracking-[0.3em] uppercase">⚠️ ALERTA DE PATIO ⚠️</div>
                        <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">
                            ¡UNA ENORME OLEADA DE TRAVESURAS SE APROXIMA!
                        </h3>
                    </div>
                </div>
            )}

            {/* Start / Level Cleared / Game Over Modal */}
            {gameState !== 'playing' && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-amber-500/60 bg-slate-950/95 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(251,191,36,0.4)]">
                        <div className="text-amber-400 text-xs font-black uppercase tracking-[0.3em] mb-1">
                            SANTI & MILE • DOGS VS MONSTERS 🐶🛡️
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'levelcleared'
                                ? '🎉 ¡PATIO DEFENDIDO!'
                                : gameState === 'gameover'
                                ? '💀 ¡LOS MONSTRUOS ENTRARON!'
                                : currentLevel.title}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'levelcleared'
                                ? `¡Has superado el ${currentLevel.title}! ${currentLevel.rewardDescription}`
                                : gameState === 'gameover'
                                ? 'Los monstruos han superado tus defensas caninas. ¡Reorganiza tus perritos y prueba otra estrategia!'
                                : currentLevel.subtitle}
                        </p>

                        {gameState === 'levelcleared' && lastRecordResult && (
                            <div className="mb-6 p-3 bg-amber-950/50 border border-amber-500/40 rounded-xl text-xs text-amber-300">
                                <div>Monedas de Sinergia Ganadas: <span className="font-bold text-yellow-400">+{lastRecordResult.coinsEarned} 🪙</span></div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            {gameState === 'levelcleared' && currentLevelIdx < LEVEL_CONFIGS.length - 1 ? (
                                <button
                                    onClick={() => startLevel(currentLevelIdx + 1)}
                                    className="w-full py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(251,191,36,0.6)] flex items-center justify-center gap-2"
                                >
                                    <span>SIGUIENTE NIVEL</span>
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => startLevel(gameState === 'levelcleared' ? 0 : currentLevelIdx)}
                                    className="w-full py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(251,191,36,0.6)] flex items-center justify-center gap-2"
                                >
                                    <span>{gameState === 'gameover' ? 'REINTENTAR 🔄' : '¡A DEFENDER EL PATIO! 🚀'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
