'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RaceAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, Zap, Shield, RotateCcw, Tv, Trophy, Flame, ArrowLeft, ArrowRight, Gauge } from 'lucide-react';

interface TurboRaceProps {
    accentColor?: string;
}

const ROAD_WIDTH = 440;
const V_WIDTH = 640;
const V_HEIGHT = 740;
const ROAD_LEFT = (V_WIDTH - ROAD_WIDTH) / 2; // 100
const ROAD_RIGHT = ROAD_LEFT + ROAD_WIDTH;   // 540
const LANE_COUNT = 4;
const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;   // 110

type VehicleType = 'sedan' | 'truck' | 'supercar';
type PickupType = 'coin' | 'nitro' | 'fuel' | 'shield';

interface TrafficCar {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    speed: number;
    type: VehicleType;
    color: string;
    grazed: boolean;
    targetX: number;
    laneChangeTimer: number;
}

interface Pickup {
    id: string;
    x: number;
    y: number;
    type: PickupType;
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

export function TurboRaceCanvas({ accentColor = '#00f0ff' }: TurboRaceProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [speedKmh, setSpeedKmh] = useState(140);
    const [distanceMeters, setDistanceMeters] = useState(0);
    const [fuel, setFuel] = useState(100);
    const [gameState, setGameState] = useState<'ready' | 'racing' | 'gameover'>('ready');
    const [mutedState, setMutedState] = useState(false);
    const [crtEnabled, setCrtEnabled] = useState(true);

    const stateRef = useRef({
        playerX: V_WIDTH / 2,
        playerY: V_HEIGHT - 130,
        playerVx: 0,
        speed: 140, // Base speed km/h
        maxSpeed: 420,
        distance: 0,
        fuel: 100,
        nitroTimer: 0,
        shieldTimer: 0,
        score: 0,
        highScore: 0,
        overtakes: 0,
        roadScrollOffset: 0,
        traffic: [] as TrafficCar[],
        pickups: [] as Pickup[],
        particles: [] as Particle[],
        floatingTexts: [] as FloatingText[],
        trafficSpawnTimer: 1.0,
        pickupSpawnTimer: 3.5,
        shakeIntensity: 0,
        shakeTime: 0,
        gameState: 'ready' as 'ready' | 'racing' | 'gameover',
        keysHeld: new Set<string>(),
        touchSteer: 0, // -1 (left), 0 (none), 1 (right)
    });

    useEffect(() => {
        setMutedState(loadMutedPreference());
        const saved = localStorage.getItem('turbo_race_highscore');
        if (saved) {
            const val = parseInt(saved, 10);
            setHighScore(val);
            stateRef.current.highScore = val;
        }
    }, []);

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
        stateRef.current.floatingTexts.push({ x, y, text, color, life: 0.8 });
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
                radius: 2 + Math.random() * 3,
                color,
                life: 0.3 + Math.random() * 0.35,
                maxLife: 0.65,
                alpha: 1.0,
            });
        }
    };

    const startNewGame = useCallback(() => {
        initArcadeAudio();
        const s = stateRef.current;
        s.playerX = V_WIDTH / 2;
        s.playerY = V_HEIGHT - 130;
        s.playerVx = 0;
        s.speed = 140;
        s.distance = 0;
        s.fuel = 100;
        s.nitroTimer = 0;
        s.shieldTimer = 0;
        s.score = 0;
        s.overtakes = 0;
        s.traffic = [];
        s.pickups = [];
        s.particles = [];
        s.floatingTexts = [];
        s.trafficSpawnTimer = 1.0;
        s.pickupSpawnTimer = 3.0;
        s.gameState = 'racing';

        setScore(0);
        setSpeedKmh(140);
        setDistanceMeters(0);
        setFuel(100);
        setGameState('racing');

        RaceAudio.checkpoint();
    }, []);

    const spawnTraffic = useCallback(() => {
        const s = stateRef.current;
        const lane = Math.floor(Math.random() * LANE_COUNT);
        const laneCenterX = ROAD_LEFT + lane * LANE_WIDTH + LANE_WIDTH / 2;

        // Ensure lane isn't obstructed
        for (const c of s.traffic) {
            if (Math.abs(c.x - laneCenterX) < 30 && c.y < 120) return;
        }

        const roll = Math.random();
        let type: VehicleType = 'sedan';
        let w = 36;
        let h = 68;
        let spd = s.speed * 0.45;
        let color = '#f59e0b'; // Amber

        if (roll > 0.70) {
            type = 'truck';
            w = 42;
            h = 130;
            spd = s.speed * 0.35;
            color = '#3b82f6'; // Blue Truck
        } else if (roll > 0.40) {
            type = 'supercar';
            w = 34;
            h = 66;
            spd = s.speed * 0.65;
            color = '#ec4899'; // Magenta Racer
        }

        s.traffic.push({
            id: crypto.randomUUID(),
            x: laneCenterX,
            y: -120,
            w,
            h,
            speed: spd,
            type,
            color,
            grazed: false,
            targetX: laneCenterX,
            laneChangeTimer: 2.0 + Math.random() * 3.0,
        });
    }, []);

    const spawnPickup = useCallback(() => {
        const s = stateRef.current;
        const lane = Math.floor(Math.random() * LANE_COUNT);
        const laneCenterX = ROAD_LEFT + lane * LANE_WIDTH + LANE_WIDTH / 2;

        const roll = Math.random();
        let type: PickupType = 'coin';
        if (roll > 0.75) type = 'nitro';
        else if (roll > 0.50) type = 'fuel';
        else if (roll > 0.35) type = 'shield';

        s.pickups.push({
            id: crypto.randomUUID(),
            x: laneCenterX,
            y: -60,
            type,
        });
    }, []);

    const activateNitro = useCallback(() => {
        const s = stateRef.current;
        if (s.gameState !== 'racing') return;
        if (s.nitroTimer <= 0) {
            s.nitroTimer = 5.0;
            RaceAudio.nitro();
            addShake(10, 0.4);
            addFloatingText(s.playerX, s.playerY - 20, '⚡ NITRO OVERDRIVE!', '#00f0ff');
        }
    }, []);

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
                ft.y -= 30 * dt;
                ft.life -= dt;
            });
            s.floatingTexts = s.floatingTexts.filter(ft => ft.life > 0);

            // ── Racing Physics ──
            if (s.gameState === 'racing') {
                // Linear Speed scaling based on distance
                if (s.nitroTimer > 0) {
                    s.nitroTimer -= dt;
                    s.speed = Math.min(s.maxSpeed, s.speed + 180 * dt);
                } else {
                    const targetSpeed = 140 + Math.min(220, s.distance * 0.04);
                    s.speed = Math.min(targetSpeed, s.speed + 15 * dt);
                }

                // Fuel consumption
                s.fuel = Math.max(0, s.fuel - (s.speed / 140) * 1.8 * dt);
                setFuel(Math.round(s.fuel));
                if (s.fuel <= 0) {
                    s.gameState = 'gameover';
                    setGameState('gameover');
                    RaceAudio.crash();
                }

                // Shield timer
                if (s.shieldTimer > 0) s.shieldTimer -= dt;

                s.distance += (s.speed * 0.15) * dt;
                s.score += Math.floor(s.speed * 0.35 * dt);
                setDistanceMeters(Math.floor(s.distance));
                setSpeedKmh(Math.round(s.speed));
                setScore(s.score);

                // Road scroll
                s.roadScrollOffset = (s.roadScrollOffset + s.speed * 2.2 * dt) % 80;

                // Steering controls
                let steer = s.touchSteer;
                if (s.keysHeld.has('a') || s.keysHeld.has('ArrowLeft')) steer = -1;
                if (s.keysHeld.has('d') || s.keysHeld.has('ArrowRight')) steer = 1;

                if (steer !== 0) {
                    s.playerVx = steer * 580;
                }

                s.playerX += s.playerVx * dt;
                s.playerX = Math.max(ROAD_LEFT + 25, Math.min(ROAD_RIGHT - 25, s.playerX));
                s.playerVx *= Math.exp(-7.0 * dt);

                // Exhaust particles
                if (s.nitroTimer > 0) {
                    spawnParticles(s.playerX - 10, s.playerY + 36, '#00f0ff', 2, 80);
                    spawnParticles(s.playerX + 10, s.playerY + 36, '#00f0ff', 2, 80);
                } else {
                    spawnParticles(s.playerX, s.playerY + 36, '#f59e0b', 1, 40);
                }

                // Traffic spawn
                s.trafficSpawnTimer -= dt;
                if (s.trafficSpawnTimer <= 0) {
                    spawnTraffic();
                    s.trafficSpawnTimer = Math.max(0.55, 2.0 - (s.speed / s.maxSpeed) * 1.2);
                }

                // Pickups spawn
                s.pickupSpawnTimer -= dt;
                if (s.pickupSpawnTimer <= 0) {
                    spawnPickup();
                    s.pickupSpawnTimer = 3.5 + Math.random() * 3.0;
                }

                // Update Traffic
                for (const c of s.traffic) {
                    const relSpeed = (s.speed - c.speed) * 2.2;
                    c.y += relSpeed * dt;

                    // Supercars lane shift
                    if (c.type === 'supercar') {
                        c.laneChangeTimer -= dt;
                        if (c.laneChangeTimer <= 0) {
                            c.laneChangeTimer = 2.0 + Math.random() * 3.0;
                            const targetLane = Math.floor(Math.random() * LANE_COUNT);
                            c.targetX = ROAD_LEFT + targetLane * LANE_WIDTH + LANE_WIDTH / 2;
                        }
                        c.x += (c.targetX - c.x) * 2.5 * dt;
                    }

                    // Near-miss Graze check
                    if (!c.grazed && Math.abs(c.y - s.playerY) < 40) {
                        const dx = Math.abs(c.x - s.playerX);
                        if (dx < 52 && dx > 34) {
                            c.grazed = true;
                            s.score += 250;
                            s.overtakes++;
                            RaceAudio.graze();
                            addFloatingText(s.playerX, s.playerY - 20, '+250 GRAZE! ✨', '#00f0ff');
                            spawnParticles(s.playerX, s.playerY, '#00f0ff', 12, 140);
                        }
                    }

                    // Collision Check
                    const dx = Math.abs(c.x - s.playerX);
                    const dy = Math.abs(c.y - s.playerY);
                    if (dx < (c.w + 36) * 0.42 && dy < (c.h + 72) * 0.42) {
                        if (s.shieldTimer > 0 || s.nitroTimer > 0) {
                            // Destroy traffic
                            c.y = 9999;
                            s.score += 500;
                            RaceAudio.crash();
                            spawnParticles(c.x, c.y, '#ef4444', 30, 240);
                            addFloatingText(c.x, c.y, '+500 SMASH! 💥', '#ef4444');
                            if (s.shieldTimer > 0) s.shieldTimer = 0;
                        } else {
                            // Crash game over
                            s.gameState = 'gameover';
                            setGameState('gameover');
                            RaceAudio.crash();
                            spawnParticles(s.playerX, s.playerY, '#ef4444', 50, 300);
                            addShake(20, 0.6);
                        }
                    }
                }

                // Update Pickups
                for (const p of s.pickups) {
                    p.y += s.speed * 2.2 * dt;
                    if (Math.hypot(p.x - s.playerX, p.y - s.playerY) < 40) {
                        p.y = 9999;
                        RaceAudio.pickup();
                        if (p.type === 'coin') {
                            s.score += 500;
                            addFloatingText(p.x, p.y, '+$500 COIN 💎', '#facc15');
                            spawnParticles(p.x, p.y, '#facc15', 16, 140);
                        } else if (p.type === 'nitro') {
                            s.nitroTimer = 5.0;
                            RaceAudio.nitro();
                            addFloatingText(p.x, p.y, '⚡ 5s NITRO!', '#00f0ff');
                            spawnParticles(p.x, p.y, '#00f0ff', 25, 200);
                        } else if (p.type === 'fuel') {
                            s.fuel = Math.min(100, s.fuel + 35);
                            addFloatingText(p.x, p.y, '+35% FUEL ⛽', '#22c55e');
                            spawnParticles(p.x, p.y, '#22c55e', 18, 150);
                        } else if (p.type === 'shield') {
                            s.shieldTimer = 8.0;
                            addFloatingText(p.x, p.y, '🛡️ SHIELD ACTIVE!', '#a855f7');
                            spawnParticles(p.x, p.y, '#a855f7', 20, 160);
                        }
                    }
                }

                // Cleanup
                s.traffic = s.traffic.filter(c => c.y < V_HEIGHT + 150 && c.y > -250);
                s.pickups = s.pickups.filter(p => p.y < V_HEIGHT + 80);

                if (s.score > s.highScore) {
                    s.highScore = s.score;
                    setHighScore(s.score);
                    localStorage.setItem('turbo_race_highscore', s.score.toString());
                }
            }

            // ── RENDER SCENE ────────────────────────────────────────────────
            ctx.save();
            ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

            if (s.shakeIntensity > 0) {
                const ox = (Math.random() * 2 - 1) * s.shakeIntensity;
                const oy = (Math.random() * 2 - 1) * s.shakeIntensity;
                ctx.translate(ox, oy);
            }

            // Dark Asphalt
            ctx.fillStyle = '#0a0d18';
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // Highway Surface
            ctx.fillStyle = '#101422';
            ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, V_HEIGHT);

            // Road Edge Curbs (Red / White rumble strips)
            for (let y = -80 + s.roadScrollOffset; y < V_HEIGHT + 80; y += 40) {
                const alt = Math.floor((y - s.roadScrollOffset) / 40) % 2 === 0;
                ctx.fillStyle = alt ? '#ef4444' : '#ffffff';
                ctx.fillRect(ROAD_LEFT - 12, y, 10, 38);
                ctx.fillRect(ROAD_RIGHT + 2, y, 10, 38);
            }

            // Dashed Lane Markers
            for (let l = 1; l < LANE_COUNT; l++) {
                const lx = ROAD_LEFT + l * LANE_WIDTH;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                for (let y = -80 + s.roadScrollOffset; y < V_HEIGHT + 80; y += 50) {
                    ctx.fillRect(lx - 2, y, 4, 26);
                }
            }

            // Pickups
            s.pickups.forEach(p => {
                ctx.save();
                const col = p.type === 'coin' ? '#facc15' : p.type === 'nitro' ? '#00f0ff' : p.type === 'fuel' ? '#22c55e' : '#a855f7';
                ctx.fillStyle = col;
                ctx.shadowColor = col;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000000';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(p.type === 'coin' ? '💎' : p.type === 'nitro' ? '⚡' : p.type === 'fuel' ? '⛽' : '🛡️', p.x, p.y);
                ctx.restore();
            });

            // Traffic Cars
            s.traffic.forEach(c => {
                ctx.save();
                ctx.fillStyle = c.color;
                ctx.shadowColor = c.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.roundRect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h, 8);
                ctx.fill();

                // Windshield
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(c.x - c.w * 0.35, c.y - c.h * 0.25, c.w * 0.7, c.h * 0.2);

                // Tail Lights
                ctx.fillStyle = '#ef4444';
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 6;
                ctx.fillRect(c.x - c.w / 2 + 4, c.y + c.h / 2 - 6, 6, 4);
                ctx.fillRect(c.x + c.w / 2 - 10, c.y + c.h / 2 - 6, 6, 4);
                ctx.restore();
            });

            // Player Race Car
            if (s.gameState !== 'gameover') {
                ctx.save();
                const pw = 36;
                const ph = 72;
                ctx.fillStyle = '#00f0ff';
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.roundRect(s.playerX - pw / 2, s.playerY - ph / 2, pw, ph, 8);
                ctx.fill();

                // Windshield
                ctx.fillStyle = '#060914';
                ctx.fillRect(s.playerX - pw * 0.35, s.playerY - ph * 0.25, pw * 0.7, ph * 0.25);

                // Headlights Beam
                ctx.fillStyle = '#facc15';
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 10;
                ctx.fillRect(s.playerX - pw / 2 + 4, s.playerY - ph / 2 + 2, 6, 4);
                ctx.fillRect(s.playerX + pw / 2 - 10, s.playerY - ph / 2 + 2, 6, 4);

                // Shield Aura
                if (s.shieldTimer > 0) {
                    ctx.strokeStyle = '#a855f7';
                    ctx.lineWidth = 2.5;
                    ctx.shadowColor = '#a855f7';
                    ctx.shadowBlur = 14;
                    ctx.beginPath();
                    ctx.arc(s.playerX, s.playerY, 44, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Nitro Trail
                if (s.nitroTimer > 0) {
                    ctx.strokeStyle = '#00f0ff';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 20;
                    ctx.beginPath();
                    ctx.moveTo(s.playerX - pw / 2, s.playerY + ph / 2);
                    ctx.lineTo(s.playerX - pw / 2, s.playerY + ph / 2 + 40);
                    ctx.moveTo(s.playerX + pw / 2, s.playerY + ph / 2);
                    ctx.lineTo(s.playerX + pw / 2, s.playerY + ph / 2 + 40);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // Particles
            s.particles.forEach(pt => {
                ctx.save();
                ctx.globalAlpha = pt.alpha;
                ctx.fillStyle = pt.color;
                ctx.shadowColor = pt.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Floating Texts
            s.floatingTexts.forEach(ft => {
                ctx.save();
                ctx.font = 'bold 13px monospace';
                ctx.fillStyle = ft.color;
                ctx.shadowColor = ft.color;
                ctx.shadowBlur = 6;
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            });

            // CRT Scanlines
            if (crtEnabled) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
                for (let y = 0; y < V_HEIGHT; y += 4) {
                    ctx.fillRect(0, y, V_WIDTH, 1.5);
                }
            }

            ctx.restore();
            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [crtEnabled, spawnTraffic, spawnPickup]);

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
            className="relative h-[74vh] max-h-[800px] min-h-[520px] w-full overflow-hidden rounded-3xl border border-white/15 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.85)] select-none font-mono"
        >
            <canvas
                ref={canvasRef}
                width={V_WIDTH}
                height={V_HEIGHT}
                className="absolute inset-0 h-full w-full block object-contain select-none"
            />

            {/* Top HUD Dashboard */}
            <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className="bg-black/85 border border-cyan-500/50 px-3 py-1.5 rounded-lg shadow-[0_0_12px_rgba(0,240,255,0.3)] pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-cyan-400 font-bold">SCORE</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{score}</div>
                    </div>
                    <div className="bg-black/85 border border-amber-500/40 px-3 py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-amber-400 font-bold">SPEED</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{speedKmh} <span className="text-[10px] text-amber-400">KM/H</span></div>
                    </div>
                    <div className="bg-black/85 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold">DIST</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{distanceMeters} <span className="text-[10px] text-emerald-400">M</span></div>
                    </div>
                    <div className="bg-black/85 border border-pink-500/40 px-2.5 py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-pink-400 font-bold">FUEL</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{fuel}%</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={() => setCrtEnabled(!crtEnabled)}
                        className={`p-2 border rounded-lg transition-all ${crtEnabled ? 'border-cyan-400 text-cyan-400 bg-cyan-950/60' : 'border-white/20 text-white/40 bg-black/80'}`}
                        title="Filtro CRT Scanlines"
                    >
                        <Tv className="w-4 h-4" />
                    </button>

                    <button
                        onClick={toggleMute}
                        className="p-2 bg-black/80 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-all"
                        title={mutedState ? 'Activar sonido' : 'Silenciar'}
                    >
                        {mutedState ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                    </button>
                </div>
            </div>

            {/* Mobile Touch Controls */}
            <div className="sm:hidden absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                {/* Steer buttons */}
                <div className="flex items-center gap-2 bg-black/70 p-2 rounded-2xl border border-white/15 backdrop-blur-md pointer-events-auto">
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

                {/* Nitro Button */}
                <button
                    onClick={activateNitro}
                    className="p-5 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl text-black font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.6)] active:scale-95 transition-all pointer-events-auto flex items-center gap-1.5"
                >
                    <Flame className="w-6 h-6" />
                    <span>NITRO</span>
                </button>
            </div>

            {/* Start / Game Over Modal */}
            {gameState !== 'racing' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-cyan-500/40 bg-slate-950/90 p-6 sm:p-8 rounded-3xl shadow-[0_0_40px_rgba(0,240,255,0.4)]">
                        <div className="text-cyan-400 text-xs font-bold uppercase tracking-[0.3em] mb-1">C++ Linear Speed Engine</div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'gameover' ? '💥 CRASHED OUT' : 'TURBO HIGHWAY 🏎️'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'gameover'
                                ? `Has recorrido ${distanceMeters} metros a ${speedKmh} km/h. Puntuación final: ${score}`
                                : 'Esquiva el tráfico en la autopista. La velocidad aumenta linealmente con la distancia. ¡Pasa rozando para ganar bonos de Graze!'}
                        </p>

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-cyan-400 to-amber-400 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,240,255,0.6)]"
                        >
                            {gameState === 'gameover' ? 'CORRER DE NUEVO 🔄' : 'ACELERAR AL MÁXIMO 🚀'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
