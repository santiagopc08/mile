'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VoidAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, ChevronLeft, ChevronRight, Flame, Crosshair } from 'lucide-react';

interface VoidRunnerProps {
    accentColor?: string;
}

const V_WIDTH = 1280;
const V_HEIGHT = 720;

export const SHIP_RADIUS = 15;
export const THRUST_ACCEL = 480;
export const TURN_SPEED = 4.2;
export const MAX_SHIP_SPEED = 480;
export const BULLET_SPEED = 740;
export const BULLET_LIFE = 1.05;
export const FIRE_INTERVAL = 0.15;

export const SHIP_HULL = [
    { x: 20, y: 0 },
    { x: -13, y: -12 },
    { x: -7, y: 0 },
    { x: -13, y: 12 },
];

interface Rock {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    tier: number; // 3, 2, 1
    radius: number;
    rotation: number;
    spin: number;
    silhouette: { x: number; y: number }[];
    color: string;
}

interface Bullet {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
    maxLife: number;
    size: number;
}


export interface GameState {
    ship: {
        x: number;
        y: number;
        vx: number;
        vy: number;
        rotation: number;
        invulnerable: number;
        alive: boolean;
    };
    rocks: Rock[];
    bullets: Bullet[];
    particles: Particle[];
    score: number;
    highScore: number;
    lives: number;
    wave: number;
    fireCooldown: number;
    waveBanner: number;
    shake: number;
    shakeOffset: { x: number; y: number };
    keys: { left: boolean; right: boolean; thrust: boolean; fire: boolean };
    gameState: 'menu' | 'playing' | 'gameover';
    nextRockId: number;
}

export interface GameCallbacks {
    setScore: (score: number) => void;
    setHighScore: (score: number) => void;
    setLives: (lives: number) => void;
    setWave: (wave: number) => void;
    setGameState: (state: 'menu' | 'playing' | 'gameover') => void;
}

export const makeRock = (state: GameState, x: number, y: number, vx: number, vy: number, tier: number): Rock => {
    const radius = tier === 3 ? 52 : tier === 2 ? 30 : 17;
    const color = tier === 3 ? '#6b7a9e' : tier === 2 ? '#8c99bd' : '#b3bddc';
    const vertices = 8 + Math.floor(Math.random() * 4);
    const silhouette: { x: number; y: number }[] = [];

    for (let i = 0; i < vertices; i++) {
        const angle = (i / vertices) * Math.PI * 2;
        const r = radius * (0.75 + Math.random() * 0.25);
        silhouette.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
        });
    }

    return {
        id: state.nextRockId++,
        x,
        y,
        vx,
        vy,
        tier,
        radius,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 2.5,
        silhouette,
        color,
    };
};

export const spawnWave = (state: GameState, callbacks: GameCallbacks, w: number, V_WIDTH: number, V_HEIGHT: number) => {
    state.wave = w;
    state.waveBanner = 2.0;
    callbacks.setWave(w);
    VoidAudio.waveStart();

    const count = Math.min(10, 3 + w);
    const newRocks: Rock[] = [];

    for (let i = 0; i < count; i++) {
        let rx = 0;
        let ry = 0;
        if (Math.random() < 0.5) {
            rx = Math.random() < 0.5 ? 40 : V_WIDTH - 40;
            ry = Math.random() * V_HEIGHT;
        } else {
            rx = Math.random() * V_WIDTH;
            ry = Math.random() < 0.5 ? 40 : V_HEIGHT - 40;
        }

        const speed = 40 + Math.random() * (40 + w * 12);
        const angle = Math.random() * Math.PI * 2;

        newRocks.push(makeRock(state, rx, ry, Math.cos(angle) * speed, Math.sin(angle) * speed, 3));
    }

    state.rocks = newRocks;
};

export const spawnParticles = (state: GameState, x: number, y: number, color: string, count = 16, speed = 220) => {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = speed * (0.2 + Math.random() * 0.9);
        state.particles.push({
            x,
            y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            color,
            life: 0,
            maxLife: 0.35 + Math.random() * 0.45,
            size: 2 + Math.random() * 3.5,
        });
    }
};

export const addShake = (state: GameState, amt: number) => {
    state.shake = Math.min(18, state.shake + amt);
};

export const fireBullet = (state: GameState) => {
    if (state.fireCooldown > 0 || !state.ship.alive) return;

    state.fireCooldown = FIRE_INTERVAL;

    const tipX = state.ship.x + Math.cos(state.ship.rotation) * 20;
    const tipY = state.ship.y + Math.sin(state.ship.rotation) * 20;

    state.bullets.push({
        x: tipX,
        y: tipY,
        vx: Math.cos(state.ship.rotation) * BULLET_SPEED + state.ship.vx * 0.2,
        vy: Math.sin(state.ship.rotation) * BULLET_SPEED + state.ship.vy * 0.2,
        life: BULLET_LIFE,
    });

    VoidAudio.laser();
    addShake(state, 1.2);
};

export const updateGame = (s: GameState, dt: number, callbacks: GameCallbacks, V_WIDTH: number, V_HEIGHT: number) => {
    // Handle Screen Shake
    if (s.shake > 0) {
        s.shake = Math.max(0, s.shake - dt * 26);
        s.shakeOffset = {
            x: (Math.random() - 0.5) * s.shake,
            y: (Math.random() - 0.5) * s.shake,
        };
    } else {
        s.shakeOffset = { x: 0, y: 0 };
    }

    if (s.gameState === 'playing') {
        if (s.fireCooldown > 0) s.fireCooldown -= dt;
        if (s.waveBanner > 0) s.waveBanner -= dt;
        if (s.ship.invulnerable > 0) s.ship.invulnerable -= dt;

        // Ship Rotation
        if (s.keys.left) s.ship.rotation -= TURN_SPEED * dt;
        if (s.keys.right) s.ship.rotation += TURN_SPEED * dt;

        // Ship Thrust
        if (s.keys.thrust && s.ship.alive) {
            s.ship.vx += Math.cos(s.ship.rotation) * THRUST_ACCEL * dt;
            s.ship.vy += Math.sin(s.ship.rotation) * THRUST_ACCEL * dt;

            // Limit speed
            const curSpeed = Math.hypot(s.ship.vx, s.ship.vy);
            if (curSpeed > MAX_SHIP_SPEED) {
                s.ship.vx = (s.ship.vx / curSpeed) * MAX_SHIP_SPEED;
                s.ship.vy = (s.ship.vy / curSpeed) * MAX_SHIP_SPEED;
            }

            // Thrust exhaust flame particles
            const tailX = s.ship.x - Math.cos(s.ship.rotation) * 14;
            const tailY = s.ship.y - Math.sin(s.ship.rotation) * 14;
            const spread = (Math.random() - 0.5) * 0.6;
            const exhaustAngle = s.ship.rotation + Math.PI + spread;
            const spd = 160 + Math.random() * 100;

            s.particles.push({
                x: tailX,
                y: tailY,
                vx: Math.cos(exhaustAngle) * spd,
                vy: Math.sin(exhaustAngle) * spd,
                color: Math.random() < 0.6 ? '#00e5ff' : '#a855f7',
                life: 0,
                maxLife: 0.25,
                size: 3,
            });

            if (Math.random() < 0.25) VoidAudio.thrust();
        }

        // Inertial Friction Damping
        s.ship.vx *= Math.pow(0.985, dt * 60);
        s.ship.vy *= Math.pow(0.985, dt * 60);

        s.ship.x += s.ship.vx * dt;
        s.ship.y += s.ship.vy * dt;

        // 360 Wrap Around Screen
        if (s.ship.x < 0) s.ship.x += V_WIDTH;
        if (s.ship.x > V_WIDTH) s.ship.x -= V_WIDTH;
        if (s.ship.y < 0) s.ship.y += V_HEIGHT;
        if (s.ship.y > V_HEIGHT) s.ship.y -= V_HEIGHT;

        if (s.keys.fire) fireBullet(s);

        // Update Bullets
        for (let i = s.bullets.length - 1; i >= 0; i--) {
            const b = s.bullets[i];
            b.life -= dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Bullet wrap
            if (b.x < 0) b.x += V_WIDTH;
            if (b.x > V_WIDTH) b.x -= V_WIDTH;
            if (b.y < 0) b.y += V_HEIGHT;
            if (b.y > V_HEIGHT) b.y -= V_HEIGHT;

            if (b.life <= 0) {
                s.bullets.splice(i, 1);
                continue;
            }

            // Bullet vs Rock Collisions
            let bulletHit = false;
            for (let j = s.rocks.length - 1; j >= 0; j--) {
                const r = s.rocks[j];
                const dist = Math.hypot(b.x - r.x, b.y - r.y);

                if (dist < r.radius) {
                    bulletHit = true;
                    VoidAudio.rockHit(r.tier);
                    spawnParticles(s, r.x, r.y, r.color, r.tier * 10, 180);
                    addShake(s, r.tier * 2.5);

                    const points = r.tier === 3 ? 50 : r.tier === 2 ? 100 : 200;
                    s.score += points;
                    callbacks.setScore(s.score);

                    if (s.score > s.highScore) {
                        s.highScore = s.score;
                        callbacks.setHighScore(s.score);
                        localStorage.setItem('voidrunner_highscore', s.score.toString());
                    }

                    // Split Rock
                    if (r.tier > 1) {
                        const nextTier = r.tier - 1;
                        const speed1 = Math.hypot(r.vx, r.vy) * 1.35 + 25;
                        const speed2 = Math.hypot(r.vx, r.vy) * 1.35 + 25;
                        const baseAngle = Math.atan2(r.vy, r.vx);

                        s.rocks.push(
                            makeRock(s, r.x, r.y, Math.cos(baseAngle + 0.6) * speed1, Math.sin(baseAngle + 0.6) * speed1, nextTier),
                            makeRock(s, r.x, r.y, Math.cos(baseAngle - 0.6) * speed2, Math.sin(baseAngle - 0.6) * speed2, nextTier)
                        );
                    }

                    s.rocks.splice(j, 1);
                    break;
                }
            }

            if (bulletHit) {
                s.bullets.splice(i, 1);
            }
        }

        // Update Rocks
        for (let i = 0; i < s.rocks.length; i++) {
            const r = s.rocks[i];
            r.x += r.vx * dt;
            r.y += r.vy * dt;
            r.rotation += r.spin * dt;

            if (r.x < 0) r.x += V_WIDTH;
            if (r.x > V_WIDTH) r.x -= V_WIDTH;
            if (r.y < 0) r.y += V_HEIGHT;
            if (r.y > V_HEIGHT) r.y -= V_HEIGHT;

            // Rock vs Ship Collision
            if (s.ship.invulnerable <= 0 && s.ship.alive) {
                const dist = Math.hypot(s.ship.x - r.x, s.ship.y - r.y);
                if (dist < r.radius + SHIP_RADIUS) {
                    // Ship destroyed
                    VoidAudio.shipHit();
                    spawnParticles(s, s.ship.x, s.ship.y, '#ff0055', 30, 280);
                    addShake(s, 12);

                    s.lives -= 1;
                    callbacks.setLives(s.lives);

                    if (s.lives <= 0) {
                        s.gameState = 'gameover';
                        callbacks.setGameState('gameover');
                    } else {
                        s.ship.x = V_WIDTH / 2;
                        s.ship.y = V_HEIGHT / 2;
                        s.ship.vx = 0;
                        s.ship.vy = 0;
                        s.ship.rotation = -Math.PI / 2;
                        s.ship.invulnerable = 2.5;
                    }
                }
            }
        }

        // Check Wave Clear
        if (s.rocks.length === 0) {
            s.score += 1000 * s.wave;
            callbacks.setScore(s.score);
            spawnWave(s, callbacks, s.wave + 1, V_WIDTH, V_HEIGHT);
        }
    }

    // Update Particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.95;
        p.vy *= 0.95;
        if (p.life >= p.maxLife) {
            s.particles.splice(i, 1);
        }
    }
};

export const renderGame = (ctx: CanvasRenderingContext2D, s: GameState, V_WIDTH: number, V_HEIGHT: number) => {
    ctx.save();
    ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

    ctx.translate(s.shakeOffset.x, s.shakeOffset.y);

    // 1. Deep Space Vector Background
    ctx.fillStyle = '#05030a';
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // Subtle warp star field
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 45; i++) {
        const sx = (i * 137.5) % V_WIDTH;
        const sy = (i * 293.7) % V_HEIGHT;
        ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // 2. Render Particles
    s.particles.forEach((p) => {
        const alpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;

    // 3. Render Bullets
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    s.bullets.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.shadowBlur = 0;

    // 4. Helper to draw wrapping objects
    const getGhosts = (x: number, y: number, r: number) => {
        const ghosts = [{ x, y }];
        if (x < r) ghosts.push({ x: x + V_WIDTH, y });
        if (x > V_WIDTH - r) ghosts.push({ x: x - V_WIDTH, y });
        if (y < r) ghosts.push({ x, y: y + V_HEIGHT });
        if (y > V_HEIGHT - r) ghosts.push({ x, y: y - V_HEIGHT });
        return ghosts;
    };

    // 5. Render Rocks (Asteroids)
    s.rocks.forEach((r) => {
        const ghosts = getGhosts(r.x, r.y, r.radius);
        ghosts.forEach((g) => {
            ctx.save();
            ctx.translate(g.x, g.y);
            ctx.rotate(r.rotation);

            ctx.fillStyle = 'rgba(12, 10, 24, 0.85)';
            ctx.strokeStyle = r.color;
            ctx.lineWidth = 2;
            ctx.shadowColor = r.color;
            ctx.shadowBlur = 8;

            ctx.beginPath();
            ctx.moveTo(r.silhouette[0].x, r.silhouette[0].y);
            for (let k = 1; k < r.silhouette.length; k++) {
                ctx.lineTo(r.silhouette[k].x, r.silhouette[k].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        });
    });

    // 6. Render Player Ship
    if (s.ship.alive) {
        const ghosts = getGhosts(s.ship.x, s.ship.y, SHIP_RADIUS);
        ghosts.forEach((g) => {
            ctx.save();
            ctx.translate(g.x, g.y);
            ctx.rotate(s.ship.rotation);

            // Ship Body
            ctx.fillStyle = '#0a0815';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 12;

            ctx.beginPath();
            ctx.moveTo(SHIP_HULL[0].x, SHIP_HULL[0].y);
            for (let k = 1; k < SHIP_HULL.length; k++) {
                ctx.lineTo(SHIP_HULL[k].x, SHIP_HULL[k].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Cockpit Glow
            ctx.fillStyle = '#a855f7';
            ctx.beginPath();
            ctx.arc(2, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            // Invulnerability Shield Aura
            if (s.ship.invulnerable > 0) {
                ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 16;
                ctx.beginPath();
                ctx.arc(0, 0, SHIP_RADIUS + 8, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        });
    }

    // 7. Wave Banner
    if (s.waveBanner > 0 && s.gameState === 'playing') {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 18;
        ctx.font = '900 36px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`OLEADA ${s.wave}`, V_WIDTH / 2, V_HEIGHT / 2 - 80);
        ctx.shadowBlur = 0;
    }

    ctx.restore();
};

export function VoidRunnerCanvas({ accentColor = '#a855f7' }: VoidRunnerProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('voidrunner_highscore');
            return saved ? parseInt(saved, 10) : 0;
        }
        return 0;
    });
    const [lives, setLives] = useState(3);
    const [wave, setWave] = useState(1);
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
    const [mutedState, setMutedState] = useState(() => {
        if (typeof window !== 'undefined') {
            return loadMutedPreference();
        }
        return false;
    });

    // 60FPS Game State Reference
    const stateRef = useRef({
        ship: {
            x: V_WIDTH / 2,
            y: V_HEIGHT / 2,
            vx: 0,
            vy: 0,
            rotation: -Math.PI / 2,
            invulnerable: 2.5,
            alive: true,
        },
        rocks: [] as Rock[],
        bullets: [] as Bullet[],
        particles: [] as Particle[],
        score: 0,
        highScore: 0,
        lives: 3,
        wave: 1,
        fireCooldown: 0,
        waveBanner: 0,
        shake: 0,
        shakeOffset: { x: 0, y: 0 },
        keys: { left: false, right: false, thrust: false, fire: false },
        gameState: 'menu' as 'menu' | 'playing' | 'gameover',
        nextRockId: 1,
    });

    useEffect(() => {
        stateRef.current.highScore = highScore;
    }, [highScore]);

    const toggleMute = useCallback(() => {
        const next = !mutedState;
        setMuted(next);
        setMutedState(next);
    }, [mutedState]);

    const callbacks = React.useMemo(() => ({
        setScore,
        setHighScore,
        setLives,
        setWave,
        setGameState,
    }), []);

    const startNewGame = useCallback(() => {
        initArcadeAudio();
        const s = stateRef.current;
        s.score = 0;
        s.lives = 3;
        s.wave = 1;
        s.bullets = [];
        s.particles = [];
        s.gameState = 'playing';

        s.ship = {
            x: V_WIDTH / 2,
            y: V_HEIGHT / 2,
            vx: 0,
            vy: 0,
            rotation: -Math.PI / 2,
            invulnerable: 2.5,
            alive: true,
        };

        setScore(0);
        setLives(3);
        setWave(1);
        setGameState('playing');

        spawnWave(s, callbacks, 1, V_WIDTH, V_HEIGHT);
    }, [callbacks]);

    // Main Game Loop
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

            updateGame(s, dt, callbacks, V_WIDTH, V_HEIGHT);
            renderGame(ctx, s, V_WIDTH, V_HEIGHT);

            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [callbacks]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.keys.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.keys.right = true;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') stateRef.current.keys.thrust = true;
            if (e.key === ' ' || e.key === 'Enter') {
                stateRef.current.keys.fire = true;
                fireBullet(stateRef.current);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.keys.right = false;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') stateRef.current.keys.thrust = false;
            if (e.key === ' ' || e.key === 'Enter') stateRef.current.keys.fire = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative h-[65vh] max-h-[680px] min-h-[420px] w-full overflow-hidden rounded-3xl border border-white/15 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.8)] select-none touch-none"
        >
            <canvas
                ref={canvasRef}
                width={V_WIDTH}
                height={V_HEIGHT}
                className="absolute inset-0 h-full w-full block object-contain select-none touch-none"
            />

            {/* Top Arcade HUD */}
            <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none font-mono">
                {/* Score */}
                <div className="bg-black/80 border border-purple-500/50 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    <div className="text-[9px] uppercase tracking-widest text-purple-400 font-bold">Puntuación</div>
                    <div className="text-lg sm:text-xl font-black text-white tabular-nums">{score}</div>
                </div>

                {/* Wave & Lives */}
                <div className="flex items-center gap-3 pointer-events-auto">
                    <div className="bg-black/80 border border-white/20 px-3 py-1.5 rounded-lg text-right">
                        <div className="text-[9px] uppercase tracking-widest text-purple-300 font-bold">Oleada {wave}</div>
                        <div className="text-sm font-black text-cyan-400">{'🚀'.repeat(lives)}</div>
                    </div>

                    <button
                        onClick={toggleMute}
                        className="p-2 bg-black/80 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-all"
                        title={mutedState ? 'Activar sonido' : 'Silenciar'}
                    >
                        {mutedState ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
                    </button>
                </div>
            </div>

            {/* Mobile Touch Controls */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between sm:hidden pointer-events-none">
                {/* Left/Right Steer */}
                <div className="flex gap-2">
                    <button
                        onPointerDown={() => (stateRef.current.keys.left = true)}
                        onPointerUp={() => (stateRef.current.keys.left = false)}
                        className="pointer-events-auto p-4 bg-purple-500/20 border border-purple-400/50 rounded-2xl active:bg-purple-500/50 text-purple-300 backdrop-blur-md"
                    >
                        <ChevronLeft className="w-7 h-7" />
                    </button>
                    <button
                        onPointerDown={() => (stateRef.current.keys.right = true)}
                        onPointerUp={() => (stateRef.current.keys.right = false)}
                        className="pointer-events-auto p-4 bg-purple-500/20 border border-purple-400/50 rounded-2xl active:bg-purple-500/50 text-purple-300 backdrop-blur-md"
                    >
                        <ChevronRight className="w-7 h-7" />
                    </button>
                </div>

                {/* Thrust & Fire Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onPointerDown={() => (stateRef.current.keys.thrust = true)}
                        onPointerUp={() => (stateRef.current.keys.thrust = false)}
                        className="pointer-events-auto p-4 bg-cyan-500/30 border border-cyan-400 rounded-2xl active:bg-cyan-500/60 text-white backdrop-blur-md"
                        title="Propulsión"
                    >
                        <Flame className="w-7 h-7" />
                    </button>
                    <button
                        onPointerDown={() => {
                            stateRef.current.keys.fire = true;
                            fireBullet(stateRef.current);
                        }}
                        onPointerUp={() => (stateRef.current.keys.fire = false)}
                        className="pointer-events-auto p-4 bg-rose-500/30 border border-rose-400 rounded-2xl active:bg-rose-500/60 text-white backdrop-blur-md"
                        title="Disparo"
                    >
                        <Crosshair className="w-7 h-7" />
                    </button>
                </div>
            </div>

            {/* Start / Game Over Overlay */}
            {gameState !== 'playing' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-purple-500/40 bg-slate-950/90 p-6 sm:p-8 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.4)]">
                        <div className="text-purple-400 text-xs font-bold uppercase tracking-[0.3em] mb-1">C++ Vector Space Combat</div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'gameover' ? '💀 NAVE DESTRUIDA' : 'VOID RUNNER 🚀'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'gameover'
                                ? `Has sobrevivido hasta la Oleada ${wave} con ${score} puntos.`
                                : 'Pilota tu nave hiperespacial con físicas de inercia real, destruye asteroides del vacío y evade los fragmentos que rebotan por toda la pantalla.'}
                        </p>

                        <div className="flex items-center justify-center gap-6 mb-6 text-xs text-white/80">
                            <div>
                                <span className="block text-[10px] text-white/40 uppercase">Récord</span>
                                <span className="font-black text-amber-400 text-base">{highScore}</span>
                            </div>
                            {gameState === 'gameover' && (
                                <div>
                                    <span className="block text-[10px] text-white/40 uppercase">Puntos</span>
                                    <span className="font-black text-purple-400 text-base">{score}</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(168,85,247,0.6)]"
                        >
                            {gameState === 'gameover' ? 'JUGAR DE NUEVO 🔄' : 'INICIAR VOID RUNNER 🕹️'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
