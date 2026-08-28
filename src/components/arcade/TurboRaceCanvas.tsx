'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RaceAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, RotateCcw, Tv, Trophy, Flame, ArrowLeft, ArrowRight, Gauge, Sparkles, Shield, Heart } from 'lucide-react';
import { useArcadeProgression } from '@/hooks/useArcadeProgression';
import { useProfile } from '@/context/ProfileContext';

interface TurboRaceProps {
    accentColor?: string;
}

const V_WIDTH = 640;
const V_HEIGHT = 740;
const HORIZON_Y = 235;

type VehicleType = 'sedan' | 'truck' | 'supercar';
type PickupType = 'coin' | 'nitro' | 'fuel' | 'shield';

interface TrafficCar {
    id: string;
    lane: number; // 0 to 3
    z: number;    // Distance ahead in meters (0 = at player, 600 = at horizon)
    speed: number;
    type: VehicleType;
    color: string;
    grazed: boolean;
    targetLane: number;
    laneChangeTimer: number;
}

interface Pickup {
    id: string;
    lane: number;
    z: number;
    type: PickupType;
}

interface RoadsideObject {
    id: string;
    side: 'left' | 'right';
    z: number;
    type: 'palm' | 'streetlight' | 'billboard';
    billboardText?: string;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    life: number;
    maxLife: number;
    alpha: number;
}

interface FloatingText {
    x: number;
    y: number;
    text: string;
    color: string;
    life: number;
}

const BILLBOARD_PHRASES = [
    'SANTI & MILE ROAD TRIP 🌴',
    'BOBA & SUNSET CAFE 🧋',
    'NEXT STOP: MIAMI BEACH 🏖️',
    'AMOR A 300 KM/H ⚡',
    'DUELO ÉL VS ELLA 👑',
    'SINERGIA AL MÁXIMO 💎',
    'TOGETHER IN HIGHWAY 💖',
    'SYNTHWAVE LOVERS 🌇',
];

export function TurboRaceCanvas({ accentColor = '#00f0ff' }: TurboRaceProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const { profile } = useProfile();
    const { recordScore, scores } = useArcadeProgression();

    const elBest = scores['turborace']?.el || 0;
    const ellaBest = scores['turborace']?.ella || 0;

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [speedKmh, setSpeedKmh] = useState(140);
    const [distanceMeters, setDistanceMeters] = useState(0);
    const [fuel, setFuel] = useState(100);
    const [gameState, setGameState] = useState<'ready' | 'racing' | 'gameover'>('ready');
    const [mutedState, setMutedState] = useState(false);
    const [crtEnabled, setCrtEnabled] = useState(true);
    const [currentBiome, setCurrentBiome] = useState<'miami' | 'tokyo' | 'cosmic'>('miami');
    const [lastRecordResult, setLastRecordResult] = useState<{ isNewPersonalBest: boolean; isNewCoupleRecord: boolean; coinsEarned: number } | null>(null);

    const stateRef = useRef({
        playerLaneX: 0, // -1.0 (far left) to 1.0 (far right)
        playerVx: 0,
        playerTilt: 0, // In radians
        speed: 140,    // Base speed km/h
        maxSpeed: 420,
        distance: 0,
        fuel: 100,
        nitroTimer: 0,
        shieldTimer: 0,
        score: 0,
        highScore: 0,
        overtakes: 0,
        roadScroll: 0,
        roadCurve: 0,
        targetCurve: 0,
        curveTimer: 3.0,
        traffic: [] as TrafficCar[],
        pickups: [] as Pickup[],
        roadside: [] as RoadsideObject[],
        particles: [] as Particle[],
        floatingTexts: [] as FloatingText[],
        trafficSpawnTimer: 1.2,
        pickupSpawnTimer: 3.0,
        roadsideSpawnTimer: 0.4,
        shakeIntensity: 0,
        shakeTime: 0,
        gameState: 'ready' as 'ready' | 'racing' | 'gameover',
        keysHeld: new Set<string>(),
        touchSteer: 0, // -1 (left), 0 (none), 1 (right)
    });

    useEffect(() => {
        setMutedState(loadMutedPreference());
        const activePb = profile === 'ella' ? ellaBest : elBest;
        setHighScore(activePb);
        stateRef.current.highScore = activePb;
    }, [profile, elBest, ellaBest]);

    const toggleMute = useCallback(() => {
        const next = !mutedState;
        setMuted(next);
        setMutedState(next);
    }, [mutedState]);

    const addShake = (intensity = 8, dur = 0.25) => {
        const s = stateRef.current;
        s.shakeIntensity = intensity;
        s.shakeTime = dur;
    };

    const addFloatingText = (x: number, y: number, text: string, color = '#facc15') => {
        stateRef.current.floatingTexts.push({ x, y, text, color, life: 0.85 });
    };

    const spawnParticles = (x: number, y: number, color: string, count = 16, speed = 180) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = speed * (0.4 + Math.random() * 0.8);
            stateRef.current.particles.push({
                x,
                y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: 2 + Math.random() * 3.5,
                color,
                life: 0.3 + Math.random() * 0.35,
                maxLife: 0.65,
                alpha: 1.0,
            });
        }
    };

    const handleGameOver = useCallback(() => {
        const s = stateRef.current;
        s.gameState = 'gameover';
        setGameState('gameover');
        RaceAudio.crash();
        spawnParticles(V_WIDTH / 2, V_HEIGHT - 120, '#ef4444', 60, 320);
        addShake(22, 0.65);

        const res = recordScore('turborace', s.score);
        setLastRecordResult(res);
    }, [recordScore]);

    const startNewGame = useCallback(() => {
        initArcadeAudio();
        const s = stateRef.current;
        s.playerLaneX = 0;
        s.playerVx = 0;
        s.playerTilt = 0;
        s.speed = 140;
        s.distance = 0;
        s.fuel = 100;
        s.nitroTimer = 0;
        s.shieldTimer = 0;
        s.score = 0;
        s.overtakes = 0;
        s.roadScroll = 0;
        s.roadCurve = 0;
        s.targetCurve = 0;
        s.curveTimer = 3.0;
        s.traffic = [];
        s.pickups = [];
        s.roadside = [];
        s.particles = [];
        s.floatingTexts = [];
        s.trafficSpawnTimer = 1.0;
        s.pickupSpawnTimer = 3.0;
        s.roadsideSpawnTimer = 0.2;
        s.gameState = 'racing';

        setScore(0);
        setSpeedKmh(140);
        setDistanceMeters(0);
        setFuel(100);
        setCurrentBiome('miami');
        setGameState('racing');

        RaceAudio.checkpoint();
    }, []);

    const spawnTraffic = useCallback(() => {
        const s = stateRef.current;
        const lane = Math.floor(Math.random() * 4); // 0, 1, 2, 3

        // Check if lane is blocked at the horizon
        for (const c of s.traffic) {
            if (c.lane === lane && c.z > 450) return;
        }

        const roll = Math.random();
        let type: VehicleType = 'sedan';
        let spd = s.speed * 0.45;
        let color = '#f59e0b'; // Amber

        if (roll > 0.70) {
            type = 'truck';
            spd = s.speed * 0.32;
            color = '#3b82f6'; // Cyber Blue Truck
        } else if (roll > 0.40) {
            type = 'supercar';
            spd = s.speed * 0.65;
            color = '#ec4899'; // Hot Magenta
        }

        s.traffic.push({
            id: crypto.randomUUID(),
            lane,
            z: 560, // Spawn far at horizon
            speed: spd,
            type,
            color,
            grazed: false,
            targetLane: lane,
            laneChangeTimer: 2.0 + Math.random() * 3.0,
        });
    }, []);

    const spawnPickup = useCallback(() => {
        const s = stateRef.current;
        const lane = Math.floor(Math.random() * 4);

        const roll = Math.random();
        let type: PickupType = 'coin';
        if (roll > 0.75) type = 'nitro';
        else if (roll > 0.50) type = 'fuel';
        else if (roll > 0.35) type = 'shield';

        s.pickups.push({
            id: crypto.randomUUID(),
            lane,
            z: 550,
            type,
        });
    }, []);

    const spawnRoadside = useCallback(() => {
        const s = stateRef.current;
        const side = Math.random() > 0.5 ? 'left' : 'right';
        const isBillboard = Math.random() > 0.65;

        s.roadside.push({
            id: crypto.randomUUID(),
            side,
            z: 580,
            type: isBillboard ? 'billboard' : 'palm',
            billboardText: isBillboard
                ? BILLBOARD_PHRASES[Math.floor(Math.random() * BILLBOARD_PHRASES.length)]
                : undefined,
        });
    }, []);

    const activateNitro = useCallback(() => {
        const s = stateRef.current;
        if (s.gameState !== 'racing') return;
        if (s.nitroTimer <= 0) {
            s.nitroTimer = 5.0;
            RaceAudio.nitro();
            addShake(12, 0.45);
            addFloatingText(V_WIDTH / 2, V_HEIGHT - 170, '⚡ NITRO OVERDRIVE!', '#00f0ff');
        }
    }, []);

    // ── MAIN 60 FPS SYNTHWAVE ROAD TRIP LOOP ────────────────────────────────
    useEffect(() => {
        let animId: number;
        let lastTime = performance.now();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Generate static starfield
        const stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
        for (let i = 0; i < 70; i++) {
            stars.push({
                x: Math.random() * V_WIDTH,
                y: Math.random() * HORIZON_Y,
                size: Math.random() * 2 + 0.8,
                alpha: Math.random() * 0.8 + 0.2,
                speed: Math.random() * 0.4 + 0.2,
            });
        }

        const loop = (time: number) => {
            const dt = Math.min((time - lastTime) / 1000, 0.05);
            lastTime = time;

            const s = stateRef.current;

            // Screen Shake decay
            if (s.shakeTime > 0) {
                s.shakeTime -= dt;
                if (s.shakeTime <= 0) s.shakeIntensity = 0;
            }

            // Update particles
            s.particles.forEach(pt => {
                pt.x += pt.vx * dt;
                pt.y += pt.vy * dt;
                pt.life -= dt;
                pt.alpha = Math.max(0, pt.life / pt.maxLife);
            });
            s.particles = s.particles.filter(pt => pt.life > 0);

            // Update floating texts
            s.floatingTexts.forEach(ft => {
                ft.y -= 34 * dt;
                ft.life -= dt;
            });
            s.floatingTexts = s.floatingTexts.filter(ft => ft.life > 0);

            // ── Dynamic Biome Resolution ──
            let biome: 'miami' | 'tokyo' | 'cosmic' = 'miami';
            if (s.distance > 3500) biome = 'cosmic';
            else if (s.distance > 1500) biome = 'tokyo';
            setCurrentBiome(biome);

            // ── Racing Physics & Perspective World ──
            if (s.gameState === 'racing') {
                // Speed & Acceleration
                if (s.nitroTimer > 0) {
                    s.nitroTimer -= dt;
                    s.speed = Math.min(s.maxSpeed, s.speed + 200 * dt);
                } else {
                    const targetSpeed = 140 + Math.min(220, s.distance * 0.045);
                    s.speed = Math.min(targetSpeed, s.speed + 18 * dt);
                }

                // Road curve evolution
                s.curveTimer -= dt;
                if (s.curveTimer <= 0) {
                    s.curveTimer = 3.5 + Math.random() * 4.0;
                    s.targetCurve = (Math.random() * 2 - 1) * 0.85;
                }
                s.roadCurve += (s.targetCurve - s.roadCurve) * 1.2 * dt;

                // Fuel consumption
                s.fuel = Math.max(0, s.fuel - (s.speed / 140) * 1.7 * dt);
                setFuel(Math.round(s.fuel));
                if (s.fuel <= 0) {
                    s.gameState = 'gameover';
                    setGameState('gameover');
                    RaceAudio.crash();
                }

                // Shield timer
                if (s.shieldTimer > 0) s.shieldTimer -= dt;

                // Distance & Score
                s.distance += (s.speed * 0.16) * dt;
                s.score += Math.floor(s.speed * 0.38 * dt);
                setDistanceMeters(Math.floor(s.distance));
                setSpeedKmh(Math.round(s.speed));
                setScore(s.score);

                // Road scroll
                s.roadScroll = (s.roadScroll + s.speed * 3.5 * dt) % 200;

                // Steering controls
                let steer = s.touchSteer;
                if (s.keysHeld.has('a') || s.keysHeld.has('ArrowLeft')) steer = -1;
                if (s.keysHeld.has('d') || s.keysHeld.has('ArrowRight')) steer = 1;

                if (steer !== 0) {
                    s.playerVx = steer * 2.4;
                    s.playerTilt = THREE_LERP(s.playerTilt, steer * 0.14, dt * 10);
                } else {
                    s.playerVx *= Math.exp(-6.0 * dt);
                    s.playerTilt = THREE_LERP(s.playerTilt, 0, dt * 8);
                }

                s.playerLaneX += s.playerVx * dt;
                s.playerLaneX = Math.max(-1.15, Math.min(1.15, s.playerLaneX));

                // Spawn timers
                s.trafficSpawnTimer -= dt;
                if (s.trafficSpawnTimer <= 0) {
                    spawnTraffic();
                    s.trafficSpawnTimer = Math.max(0.6, 2.2 - (s.speed / s.maxSpeed) * 1.3);
                }

                s.pickupSpawnTimer -= dt;
                if (s.pickupSpawnTimer <= 0) {
                    spawnPickup();
                    s.pickupSpawnTimer = 3.2 + Math.random() * 3.0;
                }

                s.roadsideSpawnTimer -= dt;
                if (s.roadsideSpawnTimer <= 0) {
                    spawnRoadside();
                    s.roadsideSpawnTimer = Math.max(0.2, 0.65 - (s.speed / s.maxSpeed) * 0.35);
                }

                // Update Traffic
                for (const c of s.traffic) {
                    const relativeZSpeed = (s.speed - c.speed) * 1.8;
                    c.z -= relativeZSpeed * dt;

                    // Supercars lane switch
                    if (c.type === 'supercar') {
                        c.laneChangeTimer -= dt;
                        if (c.laneChangeTimer <= 0) {
                            c.laneChangeTimer = 2.5 + Math.random() * 3.0;
                            c.targetLane = Math.floor(Math.random() * 4);
                        }
                        c.lane += (c.targetLane - c.lane) * 2.2 * dt;
                    }

                    // Graze Near-Miss (at player proximity z ~ 20)
                    if (!c.grazed && c.z < 35 && c.z > 0) {
                        const playerWorldLane = (s.playerLaneX + 1) * 1.5; // Maps -1..1 to 0..3
                        const dLane = Math.abs(c.lane - playerWorldLane);
                        if (dLane < 0.65 && dLane > 0.32) {
                            c.grazed = true;
                            s.score += 350;
                            s.overtakes++;
                            RaceAudio.graze();
                            addFloatingText(V_WIDTH / 2, V_HEIGHT - 160, '+350 GRAZE! ⚡', '#00f0ff');
                            spawnParticles(V_WIDTH / 2, V_HEIGHT - 120, '#00f0ff', 18, 160);
                        }
                    }

                    // Collision Check
                    if (c.z < 25 && c.z > -10) {
                        const playerWorldLane = (s.playerLaneX + 1) * 1.5;
                        const dLane = Math.abs(c.lane - playerWorldLane);
                        if (dLane < 0.42) {
                            if (s.shieldTimer > 0 || s.nitroTimer > 0) {
                                c.z = -999; // Destroyed
                                s.score += 600;
                                RaceAudio.crash();
                                spawnParticles(V_WIDTH / 2, V_HEIGHT - 120, '#ef4444', 35, 260);
                                addFloatingText(V_WIDTH / 2, V_HEIGHT - 160, '+600 SMASH! 💥', '#ef4444');
                                if (s.shieldTimer > 0) s.shieldTimer = 0;
                            } else {
                                handleGameOver();
                            }
                        }
                    }
                }

                // Update Pickups
                for (const p of s.pickups) {
                    p.z -= s.speed * 1.8 * dt;

                    if (p.z < 25 && p.z > -10) {
                        const playerWorldLane = (s.playerLaneX + 1) * 1.5;
                        if (Math.abs(p.lane - playerWorldLane) < 0.55) {
                            p.z = -999; // Collected
                            RaceAudio.pickup();
                            if (p.type === 'coin') {
                                s.score += 500;
                                addFloatingText(V_WIDTH / 2, V_HEIGHT - 160, '+$500 DIAMANTE 💎', '#facc15');
                                spawnParticles(V_WIDTH / 2, V_HEIGHT - 120, '#facc15', 20, 150);
                            } else if (p.type === 'nitro') {
                                s.nitroTimer = 5.0;
                                RaceAudio.nitro();
                                addFloatingText(V_WIDTH / 2, V_HEIGHT - 160, '⚡ 5s NITRO!', '#00f0ff');
                                spawnParticles(V_WIDTH / 2, V_HEIGHT - 120, '#00f0ff', 28, 220);
                            } else if (p.type === 'fuel') {
                                s.fuel = Math.min(100, s.fuel + 35);
                                addFloatingText(V_WIDTH / 2, V_HEIGHT - 160, '+35% COMBUSTIBLE ⛽', '#22c55e');
                                spawnParticles(V_WIDTH / 2, V_HEIGHT - 120, '#22c55e', 22, 160);
                            } else if (p.type === 'shield') {
                                s.shieldTimer = 8.0;
                                addFloatingText(V_WIDTH / 2, V_HEIGHT - 160, '🛡️ ESCUDO ACTIVO!', '#a855f7');
                                spawnParticles(V_WIDTH / 2, V_HEIGHT - 120, '#a855f7', 24, 180);
                            }
                        }
                    }
                }

                // Update Roadside
                for (const obj of s.roadside) {
                    obj.z -= s.speed * 1.8 * dt;
                }

                // Cleanups
                s.traffic = s.traffic.filter(c => c.z > -40);
                s.pickups = s.pickups.filter(p => p.z > -30);
                s.roadside = s.roadside.filter(o => o.z > -30);

                // High score tracking
                if (s.score > s.highScore) {
                    s.highScore = s.score;
                    setHighScore(s.score);
                    localStorage.setItem('turbo_race_highscore', s.score.toString());
                }
            }

            // ── RENDERING PERSPECTIVE SCENE ─────────────────────────────────
            ctx.save();
            ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

            if (s.shakeIntensity > 0) {
                const ox = (Math.random() * 2 - 1) * s.shakeIntensity;
                const oy = (Math.random() * 2 - 1) * s.shakeIntensity;
                ctx.translate(ox, oy);
            }

            // 1. SKY GRADIENT (Based on Biome)
            const skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
            if (biome === 'miami') {
                skyGrad.addColorStop(0, '#0f051d');
                skyGrad.addColorStop(0.35, '#581c87');
                skyGrad.addColorStop(0.7, '#c026d3');
                skyGrad.addColorStop(0.92, '#f59e0b');
                skyGrad.addColorStop(1, '#fde047');
            } else if (biome === 'tokyo') {
                skyGrad.addColorStop(0, '#090417');
                skyGrad.addColorStop(0.4, '#3b0764');
                skyGrad.addColorStop(0.75, '#701a75');
                skyGrad.addColorStop(0.95, '#ec4899');
                skyGrad.addColorStop(1, '#06b6d4');
            } else {
                skyGrad.addColorStop(0, '#020617');
                skyGrad.addColorStop(0.45, '#1e1b4b');
                skyGrad.addColorStop(0.8, '#1e3a8a');
                skyGrad.addColorStop(1, '#10b981');
            }
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, V_WIDTH, HORIZON_Y);

            // 2. TWINKLING STARS
            stars.forEach(st => {
                ctx.save();
                const blink = Math.sin(time * 0.003 * st.speed + st.x) * 0.3 + 0.7;
                ctx.fillStyle = `rgba(255, 255, 255, ${st.alpha * blink})`;
                ctx.fillRect(st.x, st.y, st.size, st.size);
                ctx.restore();
            });

            // 3. SYNTHWAVE STRIPED SUN
            const sunCenterX = V_WIDTH / 2 + s.roadCurve * 40;
            const sunCenterY = HORIZON_Y - 55;
            const sunRadius = 65;

            // Solar Outer Glow
            const sunGlow = ctx.createRadialGradient(sunCenterX, sunCenterY, 10, sunCenterX, sunCenterY, sunRadius * 1.5);
            sunGlow.addColorStop(0, 'rgba(253, 224, 71, 0.9)');
            sunGlow.addColorStop(0.6, 'rgba(244, 63, 94, 0.4)');
            sunGlow.addColorStop(1, 'rgba(244, 63, 94, 0)');
            ctx.fillStyle = sunGlow;
            ctx.beginPath();
            ctx.arc(sunCenterX, sunCenterY, sunRadius * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Sun Body
            const sunBody = ctx.createLinearGradient(sunCenterX, sunCenterY - sunRadius, sunCenterX, sunCenterY + sunRadius);
            sunBody.addColorStop(0, '#fef08a');
            sunBody.addColorStop(0.4, '#f59e0b');
            sunBody.addColorStop(1, '#e11d48');
            ctx.fillStyle = sunBody;
            ctx.beginPath();
            ctx.arc(sunCenterX, sunCenterY, sunRadius, 0, Math.PI * 2);
            ctx.fill();

            // Sun Horizontal Scanlines (Black slats)
            ctx.fillStyle = '#0f051d';
            const slatCount = 7;
            for (let i = 0; i < slatCount; i++) {
                const sy = sunCenterY - 10 + i * 11;
                const slatH = 2 + i * 1.2;
                ctx.fillRect(sunCenterX - sunRadius - 5, sy, sunRadius * 2 + 10, slatH);
            }

            // 4. PARALLAX MOUNTAINS / SKYLINES
            // Distant Mountains
            ctx.fillStyle = biome === 'tokyo' ? '#180728' : '#230b3b';
            ctx.beginPath();
            ctx.moveTo(0, HORIZON_Y);
            const mtnOffset = s.roadCurve * 60;
            const mtnPoints = [
                [0, HORIZON_Y - 25],
                [80, HORIZON_Y - 50],
                [160, HORIZON_Y - 28],
                [260, HORIZON_Y - 65],
                [360, HORIZON_Y - 35],
                [480, HORIZON_Y - 70],
                [560, HORIZON_Y - 40],
                [640, HORIZON_Y - 25],
            ];
            mtnPoints.forEach(([px, py]) => ctx.lineTo(px + mtnOffset * 0.3, py));
            ctx.lineTo(V_WIDTH, HORIZON_Y);
            ctx.closePath();
            ctx.fill();

            // Near Skyline / Hills
            ctx.fillStyle = biome === 'tokyo' ? '#2e0854' : '#3b1054';
            ctx.beginPath();
            ctx.moveTo(0, HORIZON_Y);
            const nearPoints = [
                [0, HORIZON_Y - 15],
                [110, HORIZON_Y - 38],
                [210, HORIZON_Y - 18],
                [310, HORIZON_Y - 48],
                [420, HORIZON_Y - 22],
                [530, HORIZON_Y - 42],
                [640, HORIZON_Y - 15],
            ];
            nearPoints.forEach(([px, py]) => ctx.lineTo(px + mtnOffset * 0.6, py));
            ctx.lineTo(V_WIDTH, HORIZON_Y);
            ctx.closePath();
            ctx.fill();

            // 5. GROUND / ROAD VERGE CYBER GRID
            const groundGrad = ctx.createLinearGradient(0, HORIZON_Y, 0, V_HEIGHT);
            groundGrad.addColorStop(0, '#13091f');
            groundGrad.addColorStop(1, '#06020c');
            ctx.fillStyle = groundGrad;
            ctx.fillRect(0, HORIZON_Y, V_WIDTH, V_HEIGHT - HORIZON_Y);

            // 6. PERSPECTIVE ROAD SCANLINES
            const totalLines = 110;
            for (let i = 0; i < totalLines; i++) {
                const y1 = HORIZON_Y + (i / totalLines) * (V_HEIGHT - HORIZON_Y);
                const y2 = HORIZON_Y + ((i + 1) / totalLines) * (V_HEIGHT - HORIZON_Y);

                // Perspective depth factors
                const k1 = Math.pow((y1 - HORIZON_Y) / (V_HEIGHT - HORIZON_Y), 2.2);
                const k2 = Math.pow((y2 - HORIZON_Y) / (V_HEIGHT - HORIZON_Y), 2.2);

                const w1 = 30 + (540 - 30) * k1;
                const w2 = 30 + (540 - 30) * k2;

                const cx1 = V_WIDTH / 2 + s.roadCurve * Math.pow(1 - k1, 2) * 160;
                const cx2 = V_WIDTH / 2 + s.roadCurve * Math.pow(1 - k2, 2) * 160;

                const lx1 = cx1 - w1 / 2;
                const rx1 = cx1 + w1 / 2;
                const lx2 = cx2 - w2 / 2;
                const rx2 = cx2 + w2 / 2;

                // Alternating road segments
                const seg = Math.floor((y1 * 2 - s.roadScroll) / 32);
                const alt = seg % 2 === 0;

                // Asphalt trapezoid
                ctx.fillStyle = alt ? '#181228' : '#120d20';
                ctx.beginPath();
                ctx.moveTo(lx1, y1);
                ctx.lineTo(rx1, y1);
                ctx.lineTo(rx2, y2);
                ctx.lineTo(lx2, y2);
                ctx.closePath();
                ctx.fill();

                // Rumble Strip Curbs (Left & Right)
                const curbW1 = Math.max(2, 24 * k1);
                const curbW2 = Math.max(2, 24 * k2);

                ctx.fillStyle = alt ? '#ff007f' : '#00f0ff';
                ctx.beginPath();
                ctx.moveTo(lx1 - curbW1, y1);
                ctx.lineTo(lx1, y1);
                ctx.lineTo(lx2, y2);
                ctx.lineTo(lx2 - curbW2, y2);
                ctx.closePath();
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(rx1, y1);
                ctx.lineTo(rx1 + curbW1, y1);
                ctx.lineTo(rx2 + curbW2, y2);
                ctx.lineTo(rx2, y2);
                ctx.closePath();
                ctx.fill();

                // Dashed Lane Dividers
                if (alt) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    for (let l = 1; l <= 3; l++) {
                        const laneOffset1 = -w1 / 2 + l * (w1 / 4);
                        const laneOffset2 = -w2 / 2 + l * (w2 / 4);
                        const dw = Math.max(1, 4 * k1);

                        ctx.fillRect(cx1 + laneOffset1 - dw / 2, y1, dw, y2 - y1 + 1);
                    }
                }
            }

            // 7. ROADSIDE OBJECTS (Sorted by Z far to near)
            const sortedRoadside = [...s.roadside].sort((a, b) => b.z - a.z);
            sortedRoadside.forEach(obj => {
                if (obj.z <= 0 || obj.z > 600) return;
                const k = Math.pow(Math.max(0, 1 - obj.z / 600), 2.2);
                const y = HORIZON_Y + k * (V_HEIGHT - HORIZON_Y);
                const w = 30 + (540 - 30) * k;
                const cx = V_WIDTH / 2 + s.roadCurve * Math.pow(1 - k, 2) * 160;

                const objX = obj.side === 'left' ? cx - w / 2 - 35 * k - 10 : cx + w / 2 + 35 * k + 10;
                const scale = Math.max(0.15, k * 1.5);

                ctx.save();
                ctx.translate(objX, y);
                ctx.scale(scale, scale);

                if (obj.type === 'palm') {
                    // Stylized Neon Palm Tree
                    ctx.strokeStyle = '#a855f7';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.quadraticCurveTo(obj.side === 'left' ? -15 : 15, -45, 0, -90);
                    ctx.stroke();

                    // Palm Fronds
                    ctx.fillStyle = '#ec4899';
                    for (let f = 0; f < 5; f++) {
                        const fa = (f - 2) * 0.45;
                        ctx.beginPath();
                        ctx.ellipse(Math.sin(fa) * 28, -90 - Math.cos(fa) * 15, 26, 8, fa, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else if (obj.type === 'billboard' && obj.billboardText) {
                    // Holographic Memory Billboard
                    ctx.fillStyle = '#1e1b4b';
                    ctx.strokeStyle = '#00f0ff';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 10;

                    // Stand Pole
                    ctx.fillRect(-4, -20, 8, 20);

                    // Sign Board
                    ctx.beginPath();
                    ctx.roundRect(-80, -75, 160, 55, 8);
                    ctx.fill();
                    ctx.stroke();

                    // Sign Text
                    ctx.fillStyle = '#fde047';
                    ctx.font = 'bold 9px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(obj.billboardText, 0, -48);
                }
                ctx.restore();
            });

            // 8. PICKUPS (Sorted by Z)
            const sortedPickups = [...s.pickups].sort((a, b) => b.z - a.z);
            sortedPickups.forEach(p => {
                if (p.z <= 0 || p.z > 600) return;
                const k = Math.pow(Math.max(0, 1 - p.z / 600), 2.2);
                const y = HORIZON_Y + k * (V_HEIGHT - HORIZON_Y);
                const w = 30 + (540 - 30) * k;
                const cx = V_WIDTH / 2 + s.roadCurve * Math.pow(1 - k, 2) * 160;

                const laneX = cx - w / 2 + (p.lane + 0.5) * (w / 4);
                const scale = Math.max(0.2, k * 1.3);

                ctx.save();
                ctx.translate(laneX, y - 10 * scale);
                ctx.scale(scale, scale);

                const col = p.type === 'coin' ? '#facc15' : p.type === 'nitro' ? '#00f0ff' : p.type === 'fuel' ? '#22c55e' : '#a855f7';
                ctx.fillStyle = col;
                ctx.shadowColor = col;
                ctx.shadowBlur = 14;

                // Bobbing animation
                const bob = Math.sin(time * 0.008 + p.lane) * 6;
                ctx.beginPath();
                ctx.arc(0, bob, 16, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000000';
                ctx.font = 'bold 14px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(p.type === 'coin' ? '💎' : p.type === 'nitro' ? '⚡' : p.type === 'fuel' ? '⛽' : '🛡️', 0, bob);
                ctx.restore();
            });

            // 9. TRAFFIC CARS (Sorted by Z)
            const sortedTraffic = [...s.traffic].sort((a, b) => b.z - a.z);
            sortedTraffic.forEach(c => {
                if (c.z <= 0 || c.z > 600) return;
                const k = Math.pow(Math.max(0, 1 - c.z / 600), 2.2);
                const y = HORIZON_Y + k * (V_HEIGHT - HORIZON_Y);
                const w = 30 + (540 - 30) * k;
                const cx = V_WIDTH / 2 + s.roadCurve * Math.pow(1 - k, 2) * 160;

                const laneX = cx - w / 2 + (c.lane + 0.5) * (w / 4);
                const carScale = Math.max(0.2, k * 1.35);

                ctx.save();
                ctx.translate(laneX, y);
                ctx.scale(carScale, carScale);

                // Car Body
                ctx.fillStyle = c.color;
                ctx.shadowColor = c.color;
                ctx.shadowBlur = 10;
                const cw = c.type === 'truck' ? 44 : 36;
                const ch = c.type === 'truck' ? 70 : 42;

                ctx.beginPath();
                ctx.roundRect(-cw / 2, -ch, cw, ch, 6);
                ctx.fill();

                // Rear Windshield
                ctx.fillStyle = '#0a0d18';
                ctx.fillRect(-cw * 0.35, -ch + 8, cw * 0.7, ch * 0.35);

                // Taillights
                ctx.fillStyle = '#ef4444';
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 12;
                ctx.fillRect(-cw / 2 + 4, -8, 8, 6);
                ctx.fillRect(cw / 2 - 12, -8, 8, 6);

                // Turn Signal for lane changes
                if (c.type === 'supercar' && Math.abs(c.targetLane - c.lane) > 0.1) {
                    const isLeft = c.targetLane < c.lane;
                    if (Math.sin(time * 0.02) > 0) {
                        ctx.fillStyle = '#fbbf24';
                        ctx.shadowColor = '#fbbf24';
                        ctx.fillRect(isLeft ? -cw / 2 + 2 : cw / 2 - 8, -14, 6, 5);
                    }
                }

                ctx.restore();
            });

            // 10. PLAYER SPORTS CAR (DeLorean / Testarossa Outrun Coupe)
            if (s.gameState !== 'gameover') {
                const playerScreenX = V_WIDTH / 2 + s.playerLaneX * 180;
                const playerScreenY = V_HEIGHT - 120;

                ctx.save();
                ctx.translate(playerScreenX, playerScreenY);
                ctx.rotate(s.playerTilt);

                const pw = 48;
                const ph = 52;

                // Car Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
                ctx.beginPath();
                ctx.ellipse(0, 10, pw * 0.75, 12, 0, 0, Math.PI * 2);
                ctx.fill();

                // Wide Aerodynamic Chassis
                ctx.fillStyle = '#00f0ff';
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.roundRect(-pw / 2, -ph, pw, ph, 8);
                ctx.fill();

                // Carbon Fiber Engine Hood / Rear Louvers
                ctx.fillStyle = '#0a0d18';
                ctx.fillRect(-pw * 0.38, -ph + 10, pw * 0.76, ph * 0.42);

                // Rear Glass Slat Lines
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 1.5;
                for (let sl = 0; sl < 3; sl++) {
                    ctx.beginPath();
                    ctx.moveTo(-pw * 0.34, -ph + 16 + sl * 6);
                    ctx.lineTo(pw * 0.34, -ph + 16 + sl * 6);
                    ctx.stroke();
                }

                // Dual Glowing LED Taillights + Brake Bar
                ctx.fillStyle = '#ff0055';
                ctx.shadowColor = '#ff0055';
                ctx.shadowBlur = 16;
                ctx.fillRect(-pw / 2 + 4, -12, 12, 8);
                ctx.fillRect(pw / 2 - 16, -12, 12, 8);
                ctx.fillRect(-pw * 0.2, -10, pw * 0.4, 4);

                // Chrome Bumper Bar
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-pw * 0.45, -2, pw * 0.9, 3);

                // Illuminated License Plate: "SANTI & MILE"
                ctx.fillStyle = '#fde047';
                ctx.fillRect(-18, -8, 36, 8);
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 5px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('SANTI & MILE', 0, -4);

                // Dual Exhaust Tips & Fire Particles
                ctx.fillStyle = '#475569';
                ctx.fillRect(-pw / 2 + 6, 0, 5, 4);
                ctx.fillRect(pw / 2 - 11, 0, 5, 4);

                if (s.nitroTimer > 0) {
                    // Twin Intense Cyan & Magenta Plasma Jets
                    const flameLen = 28 + Math.sin(time * 0.05) * 8;
                    const flameGrad1 = ctx.createLinearGradient(0, 0, 0, flameLen);
                    flameGrad1.addColorStop(0, '#ffffff');
                    flameGrad1.addColorStop(0.3, '#00f0ff');
                    flameGrad1.addColorStop(1, 'rgba(192, 38, 211, 0)');

                    ctx.fillStyle = flameGrad1;
                    ctx.beginPath();
                    ctx.moveTo(-pw / 2 + 6, 2);
                    ctx.lineTo(-pw / 2 + 8.5, flameLen);
                    ctx.lineTo(-pw / 2 + 11, 2);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(pw / 2 - 11, 2);
                    ctx.lineTo(pw / 2 - 8.5, flameLen);
                    ctx.lineTo(pw / 2 - 6, 2);
                    ctx.fill();
                } else {
                    // Normal subtle amber exhaust pop
                    const pop = Math.sin(time * 0.03) * 4;
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(-pw / 2 + 7.5, 2, 2, 4 + pop);
                    ctx.fillRect(pw / 2 - 9.5, 2, 2, 4 + pop);
                }

                // Hexagonal Shield Bubble
                if (s.shieldTimer > 0) {
                    ctx.strokeStyle = '#a855f7';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#a855f7';
                    ctx.shadowBlur = 18;
                    ctx.beginPath();
                    ctx.arc(0, -ph / 2, 46, 0, Math.PI * 2);
                    ctx.stroke();
                }

                ctx.restore();
            }

            // 11. PARTICLES & FLOATING TEXTS
            s.particles.forEach(pt => {
                ctx.save();
                ctx.globalAlpha = pt.alpha;
                ctx.fillStyle = pt.color;
                ctx.shadowColor = pt.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            s.floatingTexts.forEach(ft => {
                ctx.save();
                ctx.font = 'black 14px monospace';
                ctx.fillStyle = ft.color;
                ctx.shadowColor = ft.color;
                ctx.shadowBlur = 8;
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            });

            // 12. CRT SCANLINES OVERLAY
            if (crtEnabled) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
                for (let y = 0; y < V_HEIGHT; y += 4) {
                    ctx.fillRect(0, y, V_WIDTH, 1.5);
                }
            }

            ctx.restore();
            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [crtEnabled, spawnTraffic, spawnPickup, spawnRoadside]);

    // Keyboard handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            stateRef.current.keysHeld.add(e.key);
            if (e.key === ' ' || e.key === 'w' || e.key === 'ArrowUp') {
                activateNitro();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            stateRef.current.keysHeld.delete(e.key);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [activateNitro]);

    return (
        <div
            ref={containerRef}
            className="relative h-[74vh] max-h-[820px] min-h-[540px] w-full overflow-hidden rounded-3xl border border-white/20 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.85)] select-none font-mono"
        >
            <canvas
                ref={canvasRef}
                width={V_WIDTH}
                height={V_HEIGHT}
                className="absolute inset-0 h-full w-full block object-contain select-none"
            />

            {/* Top Dashboard HUD: Biome Badge, Distance, Score, Fuel */}
            <div className="absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                <div className="flex items-center gap-2">
                    {/* Biome Indicator */}
                    <div className="bg-black/85 border border-pink-500/50 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.4)] backdrop-blur-md pointer-events-auto flex items-center gap-1.5">
                        <span className="text-xs">
                            {currentBiome === 'miami' ? '🌅' : currentBiome === 'tokyo' ? '🏙️' : '🌌'}
                        </span>
                        <span className="text-[10px] font-black uppercase text-pink-300">
                            {currentBiome === 'miami' ? 'MIAMI SUNSET' : currentBiome === 'tokyo' ? 'TOKYO NEON' : 'COSMIC HIGHWAY'}
                        </span>
                    </div>

                    {/* Score */}
                    <div className="bg-black/85 border border-cyan-500/50 px-3 py-1.5 rounded-xl shadow-[0_0_12px_rgba(0,240,255,0.3)] backdrop-blur-md pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-cyan-400 font-bold">SCORE</div>
                        <div className="text-sm sm:text-base font-black text-white tabular-nums">{score}</div>
                    </div>

                    {/* Distance */}
                    <div className="bg-black/85 border border-amber-500/50 px-3 py-1.5 rounded-xl backdrop-blur-md pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-amber-400 font-bold">DISTANCIA</div>
                        <div className="text-sm sm:text-base font-black text-white tabular-nums">{distanceMeters} <span className="text-[9px] text-amber-400">M</span></div>
                    </div>

                    {/* Fuel Gauge */}
                    <div className={`bg-black/85 border px-3 py-1.5 rounded-xl backdrop-blur-md pointer-events-auto ${fuel < 25 ? 'border-red-500 animate-pulse' : 'border-emerald-500/50'}`}>
                        <div className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold">COMBUSTIBLE</div>
                        <div className={`text-sm sm:text-base font-black tabular-nums ${fuel < 25 ? 'text-red-400' : 'text-emerald-300'}`}>{fuel}%</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={() => setCrtEnabled(!crtEnabled)}
                        className={`p-2 border rounded-xl transition-all shadow-lg ${crtEnabled ? 'border-cyan-400 text-cyan-400 bg-cyan-950/70' : 'border-white/20 text-white/40 bg-black/80'}`}
                        title="Filtro CRT Scanlines"
                    >
                        <Tv className="w-4 h-4" />
                    </button>

                    <button
                        onClick={toggleMute}
                        className="p-2 bg-black/80 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all shadow-lg"
                        title={mutedState ? 'Activar sonido' : 'Silenciar'}
                    >
                        {mutedState ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                    </button>
                </div>
            </div>

            {/* Bottom Right Retro-Futuristic Speedometer Gauge */}
            <div className="hidden sm:flex absolute bottom-4 right-4 z-20 flex-col items-center bg-black/85 border border-cyan-500/50 p-3 rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.4)] backdrop-blur-md pointer-events-none">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-cyan-300 font-black mb-1">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>VELOCIDAD</span>
                </div>
                <div className="text-2xl font-black text-white tabular-nums drop-shadow">
                    {speedKmh} <span className="text-xs text-cyan-400">KM/H</span>
                </div>
                {/* Visual LED Arc Bar */}
                <div className="w-28 h-2 bg-white/15 rounded-full overflow-hidden mt-1.5">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-400 via-yellow-400 to-red-500 transition-all"
                        style={{ width: `${Math.min(100, (speedKmh / 420) * 100)}%` }}
                    />
                </div>
            </div>

            {/* Mobile Touch Controls */}
            <div className="sm:hidden absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                {/* Steer buttons */}
                <div className="flex items-center gap-2 bg-black/75 p-2 rounded-2xl border border-white/20 backdrop-blur-md pointer-events-auto">
                    <button
                        onTouchStart={() => { stateRef.current.touchSteer = -1; }}
                        onTouchEnd={() => { stateRef.current.touchSteer = 0; }}
                        className="p-4 bg-white/10 active:bg-cyan-500 rounded-xl text-white font-bold"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <button
                        onTouchStart={() => { stateRef.current.touchSteer = 1; }}
                        onTouchEnd={() => { stateRef.current.touchSteer = 0; }}
                        className="p-4 bg-white/10 active:bg-cyan-500 rounded-xl text-white font-bold"
                    >
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Speed indicator mobile */}
                <div className="bg-black/80 border border-cyan-500/50 px-3 py-2 rounded-xl text-center">
                    <div className="text-[8px] text-cyan-300 font-bold">KM/H</div>
                    <div className="text-base font-black text-white">{speedKmh}</div>
                </div>

                {/* Nitro Button */}
                <button
                    onClick={activateNitro}
                    className="p-4 bg-gradient-to-tr from-cyan-400 via-pink-500 to-rose-600 rounded-2xl text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.6)] active:scale-95 transition-all pointer-events-auto flex items-center gap-1.5"
                >
                    <Flame className="w-5 h-5" />
                    <span>NITRO</span>
                </button>
            </div>

            {/* Start / Game Over Modal */}
            {gameState !== 'racing' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-pink-500/50 bg-slate-950/95 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(236,72,153,0.5)]">
                        <div className="text-pink-400 text-xs font-black uppercase tracking-[0.3em] mb-1">
                            SANTI & MILE • SYNTHWAVE ROAD TRIP 🌴
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'gameover' ? '💥 CRASHED OUT' : 'TURBO HIGHWAY 🏎️'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'gameover'
                                ? `Has recorrido ${distanceMeters} metros a ${speedKmh} km/h por la autopista de neón. Puntuación final: ${score}`
                                : 'Conduce por la autopista al atardecer. Pasa rozando los vehículos para ganar bonos de Graze y recoge las gemas y nitro para acelerar.'}
                        </p>

                        {gameState === 'gameover' && lastRecordResult && (
                            <div className="mb-6 p-3 bg-pink-950/50 border border-pink-500/40 rounded-xl text-xs text-pink-300">
                                {lastRecordResult.isNewPersonalBest && <div className="font-bold text-yellow-400 mb-1">🏆 ¡NUEVO RÉCORD PERSONAL!</div>}
                                <div>Monedas de Sinergia Ganadas: <span className="font-bold text-yellow-400">+{lastRecordResult.coinsEarned} 🪙</span></div>
                            </div>
                        )}

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-[#ff4b89] via-fuchsia-500 to-cyan-400 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,75,137,0.7)]"
                        >
                            {gameState === 'gameover' ? 'CORRER DE NUEVO 🔄' : 'ACELERAR AL MÁXIMO 🚀'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function THREE_LERP(current: number, target: number, speed: number): number {
    return current + (target - current) * Math.min(1, speed);
}
