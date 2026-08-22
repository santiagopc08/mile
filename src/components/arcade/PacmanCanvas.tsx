'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PacmanAudio, initArcadeAudio, loadMutedPreference, setMuted } from '@/lib/arcadeAudio';
import { Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Tv } from 'lucide-react';

interface PacmanCanvasProps {
    accentColor?: string;
}

// 28 cols x 31 rows classic arcade maze
const MAP_STRINGS = [
    "1111111111111111111111111111",
    "1222222222222112222222222221",
    "1211112111112112111112111121",
    "1311112111112112111112111131",
    "1211112111112112111112111121",
    "1222222222222222222222222221",
    "1211112112111111112112111121",
    "1211112112111111112112111121",
    "1222222112222112222112222221",
    "1111112111110110111112111111",
    "0000012111110110111112100000",
    "0000012110000G00000112100000",
    "0000012110111RR1110112100000",
    "11111121101GGGGGG10112111111",
    "T0000020001GGGGGG1000020000T",
    "11111121101GGGGGG10112111111",
    "0000012110111111110112100000",
    "0000012110000F00000112100000",
    "0000012110111111110112100000",
    "1111112112111111112112111111",
    "1222222222222112222222222221",
    "1211112111112112111112111121",
    "1211112111112112111112111121",
    "1322112222222P02222222112231",
    "1112112112111111112112112111",
    "1112112112111111112112112111",
    "1222222112222112222112222221",
    "1211111111112112111111111121",
    "1211111111112112111111111121",
    "1222222222222222222222222221",
    "1111111111111111111111111111"
];

const MAZE_ROWS = MAP_STRINGS.length; // 31
const MAZE_COLS = MAP_STRINGS[0].length; // 28
const TILE_SIZE = 22;
const CANVAS_W = MAZE_COLS * TILE_SIZE; // 616
const CANVAS_H = MAZE_ROWS * TILE_SIZE; // 682

const PACMAN_SPEED = 5.6; // tiles per second
const GHOST_BASE_SPEED = 5.0;

interface Ghost {
    name: 'Blinky' | 'Pinky' | 'Inky' | 'Clyde';
    color: string;
    gridX: number;
    gridY: number;
    dirX: number;
    dirY: number;
    progress: number;
    frightened: boolean;
    eaten: boolean;
    inHouse: boolean;
    exitTimer: number;
}

export function PacmanCanvas({ accentColor = '#ffff00' }: PacmanCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'victory'>('menu');
    const [mutedState, setMutedState] = useState(false);
    const [crtEnabled, setCrtEnabled] = useState(false);

    const stateRef = useRef({
        grid: MAP_STRINGS.map(row => row.split('')),
        pacman: {
            gridX: 13,
            gridY: 23,
            dirX: -1,
            dirY: 0,
            nextDirX: -1,
            nextDirY: 0,
            progress: 0,
            mouth: 0.2,
            mouthDir: 1,
        },
        ghosts: [
            { name: 'Blinky' as const, color: '#ff1744', gridX: 13, gridY: 11, dirX: -1, dirY: 0, progress: 0, frightened: false, eaten: false, inHouse: false, exitTimer: 0 },
            { name: 'Pinky' as const,  color: '#ff4081', gridX: 13, gridY: 14, dirX: 0,  dirY: -1, progress: 0, frightened: false, eaten: false, inHouse: true,  exitTimer: 1.5 },
            { name: 'Inky' as const,   color: '#00e5ff', gridX: 11, gridY: 14, dirX: 0,  dirY: -1, progress: 0, frightened: false, eaten: false, inHouse: true,  exitTimer: 3.5 },
            { name: 'Clyde' as const,  color: '#ff9100', gridX: 15, gridY: 14, dirX: 0,  dirY: -1, progress: 0, frightened: false, eaten: false, inHouse: true,  exitTimer: 6.0 },
        ] as Ghost[],
        frightenedTimer: 0,
        ghostCombo: 0,
        dotsRemaining: 0,
        score: 0,
        highScore: 0,
        lives: 3,
        gameState: 'menu' as 'menu' | 'playing' | 'gameover' | 'victory',
        wakaToggle: false,
    });

    useEffect(() => {
        setMutedState(loadMutedPreference());
        const saved = localStorage.getItem('pacman_highscore');
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

    const isTileWalkable = (gx: number, gy: number, isGhost = false, ghostEaten = false) => {
        // Portal wrap tile at row 14
        if ((gx < 0 || gx >= MAZE_COLS) && gy === 14) return true;
        if (gy < 0 || gy >= MAZE_ROWS || gx < 0 || gx >= MAZE_COLS) return false;

        const tile = stateRef.current.grid[gy]?.[gx];
        if (!tile || tile === '1') return false; // Wall
        if (tile === 'R' && !isGhost && !ghostEaten) return false; // Ghost door
        return true;
    };

    const startNewGame = useCallback(() => {
        initArcadeAudio();
        const s = stateRef.current;

        // Build fresh grid
        s.grid = MAP_STRINGS.map(row => row.split(''));

        let dots = 0;
        s.grid.forEach(row => row.forEach(tile => {
            if (tile === '2' || tile === '3') dots++;
        }));
        s.dotsRemaining = dots;

        s.score = 0;
        s.lives = 3;
        s.gameState = 'playing';
        s.frightenedTimer = 0;
        s.ghostCombo = 0;

        // Pacman spawn at (13, 23)
        s.pacman = {
            gridX: 13,
            gridY: 23,
            dirX: -1,
            dirY: 0,
            nextDirX: -1,
            nextDirY: 0,
            progress: 0,
            mouth: 0.2,
            mouthDir: 1,
        };

        // 4 Ghosts
        s.ghosts = [
            { name: 'Blinky', color: '#ff1744', gridX: 13, gridY: 11, dirX: -1, dirY: 0, progress: 0, frightened: false, eaten: false, inHouse: false, exitTimer: 0 },
            { name: 'Pinky',  color: '#ff4081', gridX: 13, gridY: 14, dirX: 0,  dirY: -1, progress: 0, frightened: false, eaten: false, inHouse: true,  exitTimer: 1.5 },
            { name: 'Inky',   color: '#00e5ff', gridX: 11, gridY: 14, dirX: 0,  dirY: -1, progress: 0, frightened: false, eaten: false, inHouse: true,  exitTimer: 3.5 },
            { name: 'Clyde',  color: '#ff9100', gridX: 15, gridY: 14, dirX: 0,  dirY: -1, progress: 0, frightened: false, eaten: false, inHouse: true,  exitTimer: 6.0 },
        ];

        setScore(0);
        setLives(3);
        setGameState('playing');
    }, []);

    const bufferDirection = (dx: number, dy: number) => {
        const p = stateRef.current.pacman;
        p.nextDirX = dx;
        p.nextDirY = dy;

        // Immediate 180-degree turnaround without waiting for next tile intersection
        if (p.dirX === -dx && p.dirY === -dy && (dx !== 0 || dy !== 0)) {
            p.gridX += p.dirX;
            p.gridY += p.dirY;
            p.dirX = dx;
            p.dirY = dy;
            p.progress = 1.0 - p.progress;
        }
    };

    // Main 60fps Loop
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

            if (s.gameState === 'playing') {
                // Frightened Timer
                if (s.frightenedTimer > 0) {
                    s.frightenedTimer -= dt;
                    if (s.frightenedTimer <= 0) {
                        s.ghosts.forEach(g => (g.frightened = false));
                    }
                }

                // ── 1. UPDATE PAC-MAN ────────────────────────────────────────
                const p = s.pacman;

                // Animate mouth
                p.mouth += p.mouthDir * dt * 5;
                if (p.mouth > 0.45) p.mouthDir = -1;
                if (p.mouth < 0.05) p.mouthDir = 1;

                // If Pacman is at tile center (progress === 0), try buffered direction
                if (p.progress <= 0.0001) {
                    p.progress = 0;
                    if (p.nextDirX !== 0 || p.nextDirY !== 0) {
                        if (isTileWalkable(p.gridX + p.nextDirX, p.gridY + p.nextDirY)) {
                            p.dirX = p.nextDirX;
                            p.dirY = p.nextDirY;
                        }
                    }
                }

                // Move forward if current direction is walkable
                if (p.dirX !== 0 || p.dirY !== 0) {
                    const targetX = p.gridX + p.dirX;
                    const targetY = p.gridY + p.dirY;

                    if (isTileWalkable(targetX, targetY)) {
                        p.progress += PACMAN_SPEED * dt;

                        if (p.progress >= 1.0) {
                            p.progress = 0;
                            p.gridX += p.dirX;
                            p.gridY += p.dirY;

                            // Portal wrap at row 14
                            if (p.gridX < 0) p.gridX = MAZE_COLS - 1;
                            else if (p.gridX >= MAZE_COLS) p.gridX = 0;

                            // Check dot/energizer collection at new tile
                            if (p.gridY >= 0 && p.gridY < MAZE_ROWS && p.gridX >= 0 && p.gridX < MAZE_COLS) {
                                const tile = s.grid[p.gridY]?.[p.gridX];
                                if (tile === '2') {
                                    // Regular Dot
                                    s.grid[p.gridY][p.gridX] = '0';
                                    s.score += 10;
                                    s.dotsRemaining--;
                                    setScore(s.score);
                                    s.wakaToggle = !s.wakaToggle;
                                    PacmanAudio.waka(s.wakaToggle);
                                } else if (tile === '3') {
                                    // Energizer
                                    s.grid[p.gridY][p.gridX] = '0';
                                    s.score += 50;
                                    s.dotsRemaining--;
                                    setScore(s.score);
                                    s.frightenedTimer = 8.0;
                                    s.ghostCombo = 0;
                                    s.ghosts.forEach(g => {
                                        if (!g.eaten) g.frightened = true;
                                    });
                                    PacmanAudio.energizer();
                                }

                                if (s.score > s.highScore) {
                                    s.highScore = s.score;
                                    setHighScore(s.score);
                                    localStorage.setItem('pacman_highscore', s.score.toString());
                                }

                                if (s.dotsRemaining <= 0) {
                                    s.gameState = 'victory';
                                    setGameState('victory');
                                    PacmanAudio.eatFruit();
                                }
                            }

                            // Try turning in buffered direction upon reaching new tile
                            if (p.nextDirX !== 0 || p.nextDirY !== 0) {
                                if (isTileWalkable(p.gridX + p.nextDirX, p.gridY + p.nextDirY)) {
                                    p.dirX = p.nextDirX;
                                    p.dirY = p.nextDirY;
                                }
                            }
                        }
                    } else {
                        p.progress = 0;
                    }
                }

                // Compute smooth pixel coordinates for Pac-Man
                const pacScreenX = (p.gridX + p.dirX * p.progress) * TILE_SIZE + TILE_SIZE / 2;
                const pacScreenY = (p.gridY + p.dirY * p.progress) * TILE_SIZE + TILE_SIZE / 2;

                // ── 2. UPDATE GHOSTS ─────────────────────────────────────────
                s.ghosts.forEach(g => {
                    // Check if ghost is exiting house
                    if (g.inHouse) {
                        g.exitTimer -= dt;
                        if (g.exitTimer <= 0) {
                            g.inHouse = false;
                            g.gridX = 13;
                            g.gridY = 11;
                            g.dirX = -1;
                            g.dirY = 0;
                            g.progress = 0;
                        } else {
                            return;
                        }
                    }

                    const speed = g.eaten ? 10.0 : g.frightened ? 3.2 : GHOST_BASE_SPEED;
                    g.progress += speed * dt;

                    if (g.progress >= 1.0) {
                        g.progress = 0;
                        g.gridX += g.dirX;
                        g.gridY += g.dirY;

                        // Wrap portals
                        if (g.gridX < 0) g.gridX = MAZE_COLS - 1;
                        else if (g.gridX >= MAZE_COLS) g.gridX = 0;

                        // If eaten and reached ghost door / house, revive
                        if (g.eaten && g.gridX === 13 && g.gridY === 11) {
                            g.eaten = false;
                            g.frightened = false;
                        }

                        // Determine ghost target tile
                        let targetX = p.gridX;
                        let targetY = p.gridY;

                        if (g.eaten) {
                            targetX = 13;
                            targetY = 11;
                        } else if (g.frightened) {
                            targetX = Math.floor(Math.random() * MAZE_COLS);
                            targetY = Math.floor(Math.random() * MAZE_ROWS);
                        } else if (g.name === 'Pinky') {
                            targetX = p.gridX + p.dirX * 4;
                            targetY = p.gridY + p.dirY * 4;
                        } else if (g.name === 'Inky') {
                            const blinky = s.ghosts[0];
                            const pivotX = p.gridX + p.dirX * 2;
                            const pivotY = p.gridY + p.dirY * 2;
                            targetX = pivotX + (pivotX - blinky.gridX);
                            targetY = pivotY + (pivotY - blinky.gridY);
                        } else if (g.name === 'Clyde') {
                            const dist = Math.hypot(g.gridX - p.gridX, g.gridY - p.gridY);
                            targetX = dist > 8 ? p.gridX : 0;
                            targetY = dist > 8 ? p.gridY : MAZE_ROWS - 1;
                        }

                        // Available movement options (no 180 reversals unless stuck)
                        const candidates = [
                            { dx: 0, dy: -1 }, // UP
                            { dx: -1, dy: 0 }, // LEFT
                            { dx: 0, dy: 1 },  // DOWN
                            { dx: 1, dy: 0 },  // RIGHT
                        ].filter(cand => {
                            if (cand.dx === -g.dirX && cand.dy === -g.dirY) return false;
                            return isTileWalkable(g.gridX + cand.dx, g.gridY + cand.dy, true, g.eaten);
                        });

                        if (candidates.length > 0) {
                            candidates.sort((a, b) => {
                                const distA = Math.hypot(g.gridX + a.dx - targetX, g.gridY + a.dy - targetY);
                                const distB = Math.hypot(g.gridX + b.dx - targetX, g.gridY + b.dy - targetY);
                                return distA - distB;
                            });
                            g.dirX = candidates[0].dx;
                            g.dirY = candidates[0].dy;
                        } else {
                            g.dirX = -g.dirX;
                            g.dirY = -g.dirY;
                        }
                    }

                    // Ghost screen position
                    const ghostScreenX = (g.gridX + g.dirX * g.progress) * TILE_SIZE + TILE_SIZE / 2;
                    const ghostScreenY = (g.gridY + g.dirY * g.progress) * TILE_SIZE + TILE_SIZE / 2;

                    // Check Collision with Pacman
                    const dist = Math.hypot(ghostScreenX - pacScreenX, ghostScreenY - pacScreenY);
                    if (dist < TILE_SIZE * 0.8) {
                        if (g.frightened && !g.eaten) {
                            // Pacman eats ghost
                            g.frightened = false;
                            g.eaten = true;
                            s.ghostCombo++;
                            const pts = Math.pow(2, s.ghostCombo) * 100;
                            s.score += pts;
                            setScore(s.score);
                            PacmanAudio.eatGhost();
                        } else if (!g.eaten) {
                            // Ghost eats Pacman
                            PacmanAudio.death();
                            s.lives--;
                            setLives(s.lives);

                            if (s.lives <= 0) {
                                s.gameState = 'gameover';
                                setGameState('gameover');
                            } else {
                                p.gridX = 13;
                                p.gridY = 23;
                                p.dirX = -1;
                                p.dirY = 0;
                                p.nextDirX = -1;
                                p.nextDirY = 0;
                                p.progress = 0;

                                s.ghosts[0].gridX = 13; s.ghosts[0].gridY = 11; s.ghosts[0].dirX = -1; s.ghosts[0].dirY = 0; s.ghosts[0].progress = 0;
                                s.ghosts[1].inHouse = true; s.ghosts[1].exitTimer = 1.5; s.ghosts[1].gridX = 13; s.ghosts[1].gridY = 14;
                                s.ghosts[2].inHouse = true; s.ghosts[2].exitTimer = 3.5; s.ghosts[2].gridX = 11; s.ghosts[2].gridY = 14;
                                s.ghosts[3].inHouse = true; s.ghosts[3].exitTimer = 6.0; s.ghosts[3].gridX = 15; s.ghosts[3].gridY = 14;
                            }
                        }
                    }
                });
            }

            // ── 3. RENDER CANVAS (High-Contrast Cyber-Neon Arcade) ───────────
            ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

            // Deep background
            ctx.fillStyle = '#060412';
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

            // Render Maze Walls
            for (let r = 0; r < MAZE_ROWS; r++) {
                const row = s.grid[r];
                if (!row) continue;

                for (let c = 0; c < MAZE_COLS; c++) {
                    const tile = row[c];
                    const px = c * TILE_SIZE;
                    const py = r * TILE_SIZE;

                    if (tile === '1') {
                        // High-contrast vibrant neon blue cyber wall
                        ctx.fillStyle = '#101c54';
                        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                        ctx.strokeStyle = '#00d2ff';
                        ctx.lineWidth = 2;
                        ctx.shadowColor = '#00d2ff';
                        ctx.shadowBlur = 6;
                        ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                        ctx.shadowBlur = 0;
                    } else if (tile === 'R') {
                        // Ghost House Door
                        ctx.fillStyle = '#ff007f';
                        ctx.shadowColor = '#ff007f';
                        ctx.shadowBlur = 8;
                        ctx.fillRect(px, py + TILE_SIZE / 2 - 3, TILE_SIZE, 6);
                        ctx.shadowBlur = 0;
                    } else if (tile === '2') {
                        // Regular Golden Dot
                        ctx.fillStyle = '#ffecb3';
                        ctx.shadowColor = '#ffb300';
                        ctx.shadowBlur = 4;
                        ctx.beginPath();
                        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 3.2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    } else if (tile === '3') {
                        // Energizer Power Pellet (Bright Pulsing Star)
                        const pulse = 1.0 + Math.sin(time * 0.01) * 0.25;
                        ctx.fillStyle = '#ffff55';
                        ctx.shadowColor = '#ffff00';
                        ctx.shadowBlur = 14;
                        ctx.beginPath();
                        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 7.5 * pulse, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }
            }

            // Render Pac-Man
            const p = s.pacman;
            const pacX = (p.gridX + p.dirX * p.progress) * TILE_SIZE + TILE_SIZE / 2;
            const pacY = (p.gridY + p.dirY * p.progress) * TILE_SIZE + TILE_SIZE / 2;

            let pacAngle = 0;
            if (p.dirX === 1) pacAngle = 0;
            else if (p.dirX === -1) pacAngle = Math.PI;
            else if (p.dirY === 1) pacAngle = Math.PI / 2;
            else if (p.dirY === -1) pacAngle = -Math.PI / 2;

            ctx.fillStyle = '#ffe600';
            ctx.shadowColor = '#ffe600';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(pacX, pacY, 10, pacAngle + p.mouth * Math.PI, pacAngle + (2 - p.mouth) * Math.PI);
            ctx.lineTo(pacX, pacY);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            // Render Ghosts
            s.ghosts.forEach(g => {
                const gx = g.inHouse ? g.gridX * TILE_SIZE + TILE_SIZE / 2 : (g.gridX + g.dirX * g.progress) * TILE_SIZE + TILE_SIZE / 2;
                const gy = g.inHouse ? g.gridY * TILE_SIZE + TILE_SIZE / 2 + Math.sin(time * 0.008) * 3 : (g.gridY + g.dirY * g.progress) * TILE_SIZE + TILE_SIZE / 2;

                const ghostCol = g.frightened ? (Math.sin(time * 0.015) > 0 ? '#1d4ed8' : '#3b82f6') : g.color;

                if (!g.eaten) {
                    ctx.fillStyle = ghostCol;
                    ctx.shadowColor = ghostCol;
                    ctx.shadowBlur = 10;

                    // Ghost dome & wavy skirt
                    ctx.beginPath();
                    ctx.arc(gx, gy - 2, 9, Math.PI, 0);
                    ctx.lineTo(gx + 9, gy + 9);
                    ctx.lineTo(gx + 5, gy + 6);
                    ctx.lineTo(gx, gy + 9);
                    ctx.lineTo(gx - 5, gy + 6);
                    ctx.lineTo(gx - 9, gy + 9);
                    ctx.closePath();
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }

                // Eyes
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(gx - 3.5, gy - 3, 3, 0, Math.PI * 2);
                ctx.arc(gx + 3.5, gy - 3, 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = g.frightened ? '#ff4081' : '#09090b';
                const eyeOffsetX = g.dirX * 1.6;
                const eyeOffsetY = g.dirY * 1.6;
                ctx.beginPath();
                ctx.arc(gx - 3.5 + eyeOffsetX, gy - 3 + eyeOffsetY, 1.5, 0, Math.PI * 2);
                ctx.arc(gx + 3.5 + eyeOffsetX, gy - 3 + eyeOffsetY, 1.5, 0, Math.PI * 2);
                ctx.fill();
            });

            // CRT Scanline Filter Overlay (Optional)
            if (crtEnabled) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                for (let y = 0; y < CANVAS_H; y += 4) {
                    ctx.fillRect(0, y, CANVAS_W, 1.5);
                }
            }

            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [crtEnabled]);

    // Keyboard Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                bufferDirection(-1, 0);
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                bufferDirection(1, 0);
            }
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                bufferDirection(0, -1);
            }
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                e.preventDefault();
                bufferDirection(0, 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Mobile Touch Gesture Support (Swipe anywhere on canvas)
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length > 0) {
            touchStartRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current || e.changedTouches.length === 0) return;
        const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
        const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
        touchStartRef.current = null;

        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 15) {
            bufferDirection(dx > 0 ? 1 : -1, 0);
        } else if (Math.abs(dy) > 15) {
            bufferDirection(0, dy > 0 ? 1 : -1);
        }
    };

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative h-[72vh] max-h-[780px] min-h-[500px] w-full overflow-hidden rounded-3xl border border-white/15 bg-[#060412] shadow-[0_24px_70px_rgba(0,0,0,0.85)] select-none touch-none"
        >
            {/* Centered Canvas */}
            <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="absolute inset-0 h-full w-full block object-contain select-none touch-none"
            />

            {/* Top Arcade HUD */}
            <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none font-mono">
                <div className="flex items-center gap-3">
                    <div className="bg-black/85 border border-yellow-500/50 px-3 py-1.5 rounded-lg shadow-[0_0_12px_rgba(255,255,0,0.3)] pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-yellow-400 font-bold">1UP</div>
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">{score}</div>
                    </div>
                    <div className="bg-black/85 border border-white/20 px-3 py-1.5 rounded-lg pointer-events-auto">
                        <div className="text-[8px] uppercase tracking-widest text-white/50 font-bold">HIGH</div>
                        <div className="text-base sm:text-lg font-black text-amber-400 tabular-nums">{highScore}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="text-sm font-black text-yellow-400 bg-black/80 px-2.5 py-1 rounded-lg border border-white/10">
                        {'🟡'.repeat(lives)}
                    </div>

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
                        {mutedState ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-yellow-400" />}
                    </button>
                </div>
            </div>

            {/* Mobile Touch Control Pads (Floating Non-Obstructive) */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between sm:hidden pointer-events-none">
                {/* Left/Right Horizontal Steer on Left Thumb */}
                <div className="flex gap-2">
                    <button
                        onPointerDown={() => bufferDirection(-1, 0)}
                        className="pointer-events-auto p-3.5 bg-yellow-500/25 border border-yellow-400/60 rounded-2xl active:bg-yellow-500/60 text-yellow-300 backdrop-blur-md shadow-xl"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <button
                        onPointerDown={() => bufferDirection(1, 0)}
                        className="pointer-events-auto p-3.5 bg-yellow-500/25 border border-yellow-400/60 rounded-2xl active:bg-yellow-500/60 text-yellow-300 backdrop-blur-md shadow-xl"
                    >
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Up/Down Vertical Steer on Right Thumb */}
                <div className="flex gap-2">
                    <button
                        onPointerDown={() => bufferDirection(0, -1)}
                        className="pointer-events-auto p-3.5 bg-yellow-500/25 border border-yellow-400/60 rounded-2xl active:bg-yellow-500/60 text-yellow-300 backdrop-blur-md shadow-xl"
                    >
                        <ArrowUp className="w-6 h-6" />
                    </button>
                    <button
                        onPointerDown={() => bufferDirection(0, 1)}
                        className="pointer-events-auto p-3.5 bg-yellow-500/25 border border-yellow-400/60 rounded-2xl active:bg-yellow-500/60 text-yellow-300 backdrop-blur-md shadow-xl"
                    >
                        <ArrowDown className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Start / Game Over Overlay */}
            {gameState !== 'playing' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center font-mono">
                    <div className="max-w-md w-full border border-yellow-500/40 bg-slate-950/90 p-6 sm:p-8 rounded-3xl shadow-[0_0_40px_rgba(255,255,0,0.4)]">
                        <div className="text-yellow-400 text-xs font-bold uppercase tracking-[0.3em] mb-1">Arcade Engine Classic</div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                            {gameState === 'victory' ? '🏆 ¡LABERINTO LIMPIO!' : gameState === 'gameover' ? '💀 GAME OVER' : 'PAC-MAN ARCADE 🟡'}
                        </h2>

                        <p className="text-xs text-white/70 mb-6 leading-relaxed">
                            {gameState === 'victory'
                                ? `¡Has completado el laberinto con ${score} puntos!`
                                : gameState === 'gameover'
                                ? `Te has quedado sin vidas. Puntuación final: ${score}`
                                : 'Devora todos los puntos del laberinto, esquiva a los 4 fantasmas (Blinky, Pinky, Inky, Clyde) y devóralos con los energizadores.'}
                        </p>

                        <button
                            onClick={startNewGame}
                            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black uppercase text-base tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,255,0,0.6)]"
                        >
                            {gameState === 'gameover' || gameState === 'victory' ? 'JUGAR DE NUEVO 🔄' : 'INICIAR PAC-MAN 🕹️'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
