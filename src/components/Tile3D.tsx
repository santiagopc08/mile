'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TileState } from './MahjongTile';
import { useProfile } from '@/context/ProfileContext';

const TILE_WIDTH = 0.82;
const TILE_HEIGHT = 1.16;
const TILE_BACK_DEPTH = 0.28;
const TILE_FACE_WIDTH = 0.82;
const TILE_FACE_HEIGHT = 1.16;
const TILE_FACE_DEPTH = 0.32;

// Geometrías compartidas: todas las fichas tienen las mismas dimensiones, así que
// reutilizamos una sola instancia por cara en lugar de crear dos BoxGeometry por
// ficha (con 96-128 fichas eso ahorra mucha memoria y allocations en GPU).
// Se pasan por prop `geometry`, por lo que R3F NO las libera al desmontar la ficha.
const BACK_GEOMETRY = new THREE.BoxGeometry(TILE_WIDTH, TILE_HEIGHT, TILE_BACK_DEPTH);
const FRONT_GEOMETRY = new THREE.BoxGeometry(TILE_FACE_WIDTH, TILE_FACE_HEIGHT, TILE_FACE_DEPTH);

// ─── Caché LRU de texturas de ficha ──────────────────────────────────────────
// Muchas fichas comparten el mismo símbolo/imagen, así que reutilizamos la
// CanvasTexture en lugar de repintar un canvas 256×256 por cada ficha. El caché
// es dueño del ciclo de vida (no se hace dispose por ficha); la evicción LRU
// libera las texturas menos usadas. El tope supera de sobra el máximo de fichas
// simultáneas en el tablero (≤128) para no evictar una textura aún en uso.
const MAX_TILE_TEXTURE_CACHE = 256;
const tileTextureCache = new Map<string, THREE.CanvasTexture>();
// Cargas de imagen en vuelo, para que fichas iguales compartan una sola textura
const pendingTileTextures = new Map<string, Promise<THREE.CanvasTexture>>();

function buildTileTextureKey(
    tile: TileState,
    accentColor: string,
    mirrorVariant?: 'flipX' | 'flipY' | 'rot90' | 'rot270'
): string {
    return [
        tile.content.type,
        tile.content.value,
        accentColor,
        mirrorVariant || '',
        tile.isLocked ? 'L' : '',
        tile.isBomb && tile.bombTimer !== undefined ? `B${tile.bombTimer}` : '',
        tile.iceCounter ? `I${tile.iceCounter}` : '',
        tile.isSmoked ? 'S' : '',
    ].join('|');
}

function getCachedTileTexture(key: string): THREE.CanvasTexture | undefined {
    const tex = tileTextureCache.get(key);
    if (tex) {
        // Refrescar orden LRU
        tileTextureCache.delete(key);
        tileTextureCache.set(key, tex);
    }
    return tex;
}

function setCachedTileTexture(key: string, tex: THREE.CanvasTexture) {
    tileTextureCache.set(key, tex);
    if (tileTextureCache.size > MAX_TILE_TEXTURE_CACHE) {
        const oldestKey = tileTextureCache.keys().next().value;
        if (oldestKey !== undefined) {
            const old = tileTextureCache.get(oldestKey);
            tileTextureCache.delete(oldestKey);
            old?.dispose();
        }
    }
}

function createTileTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// Hook interno para cargar y formatear texturas en canvas 2D con bordes brutalistas no-planos
function useTileTexture(tile: TileState, accentColor: string, mirrorVariant?: 'flipX' | 'flipY' | 'rot90' | 'rot270') {
    const [texture, setTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        let active = true;

        // Reutilizar textura ya generada si el símbolo/estado coincide
        const key = buildTileTextureKey(tile, accentColor, mirrorVariant);
        const cached = getCachedTileTexture(key);
        if (cached) {
            setTexture(cached);
            return () => { active = false; };
        }

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const isGolden = tile.content.type === 'custom';

        // Función reutilizable para dibujar bordes y esquinas de estilo retro-cyber HUD super delgados y detallados
        const drawBordersAndTicks = (golden: boolean) => {
            if (golden) {
                // Borde exterior delgado dorado
                ctx.strokeStyle = '#937500';
                ctx.lineWidth = 4;
                ctx.strokeRect(4, 4, 248, 248);

                // Borde interior extra fino dorado brillante
                ctx.strokeStyle = '#d4af37';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(12, 12, 232, 232);

                // Corchetes de esquina ultra delgados y estilizados
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(12, 22); ctx.lineTo(12, 12); ctx.lineTo(22, 12);
                ctx.moveTo(244, 22); ctx.lineTo(244, 12); ctx.lineTo(234, 12);
                ctx.moveTo(12, 234); ctx.lineTo(12, 244); ctx.lineTo(22, 244);
                ctx.moveTo(244, 234); ctx.lineTo(244, 244); ctx.lineTo(234, 244);
                ctx.stroke();

                // Ticks tácticos HUD minimalistas en los bordes
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(125, 4, 6, 2);
                ctx.fillRect(125, 250, 6, 2);
                ctx.fillRect(4, 125, 2, 6);
                ctx.fillRect(250, 125, 2, 6);
            } else {
                // Borde exterior delgado color neón
                ctx.strokeStyle = accentColor;
                ctx.lineWidth = 4;
                ctx.strokeRect(4, 4, 248, 248);

                // Borde interior extra fino semi-transparente
                ctx.strokeStyle = accentColor + '66';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(12, 12, 232, 232);

                // Corchetes de esquina ultra delgados y estilizados
                ctx.strokeStyle = accentColor;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(12, 22); ctx.lineTo(12, 12); ctx.lineTo(22, 12);
                ctx.moveTo(244, 22); ctx.lineTo(244, 12); ctx.lineTo(234, 12);
                ctx.moveTo(12, 234); ctx.lineTo(12, 244); ctx.lineTo(22, 244);
                ctx.moveTo(244, 234); ctx.lineTo(244, 244); ctx.lineTo(234, 244);
                ctx.stroke();

                // Ticks tácticos HUD minimalistas en los bordes
                ctx.fillStyle = accentColor;
                ctx.fillRect(125, 4, 6, 2);
                ctx.fillRect(125, 250, 6, 2);
                ctx.fillRect(4, 125, 2, 6);
                ctx.fillRect(250, 125, 2, 6);
            }
        };

        const isCanvasRender = ['traditional', 'bottle_message', 'calendar_date', 'clock_time', 'drawing_tile'].includes(tile.content.type);

        if (isCanvasRender) {
            // Fondo
            if (tile.content.type === 'bottle_message') {
                const tealGrad = ctx.createLinearGradient(0, 0, 256, 256);
                tealGrad.addColorStop(0, '#008080');
                tealGrad.addColorStop(0.5, '#004d4d');
                tealGrad.addColorStop(1, '#001a1a');
                ctx.fillStyle = tealGrad;
                ctx.fillRect(0, 0, 256, 256);
            } else if (tile.content.type === 'drawing_tile') {
                const purpleGrad = ctx.createLinearGradient(0, 0, 256, 256);
                purpleGrad.addColorStop(0, '#5b21b6');
                purpleGrad.addColorStop(0.5, '#3b0764');
                purpleGrad.addColorStop(1, '#1e1b4b');
                ctx.fillStyle = purpleGrad;
                ctx.fillRect(0, 0, 256, 256);
            } else if (tile.content.type === 'calendar_date') {
                ctx.fillStyle = '#1c1917'; // stone-900
                ctx.fillRect(0, 0, 256, 256);
            } else if (tile.content.type === 'clock_time') {
                ctx.fillStyle = '#0c0a09'; // stone-950
                ctx.fillRect(0, 0, 256, 256);
            } else if (isGolden) {
                const goldGrad = ctx.createLinearGradient(0, 0, 256, 256);
                goldGrad.addColorStop(0, '#ffe57f');
                goldGrad.addColorStop(0.4, '#ffea9f');
                goldGrad.addColorStop(0.7, '#ffd700');
                goldGrad.addColorStop(1, '#b29300');
                ctx.fillStyle = goldGrad;
                ctx.fillRect(0, 0, 256, 256);
            } else {
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(0, 0, 256, 256);
            }

            // Dibujar bordes con estética no-plana
            drawBordersAndTicks(isGolden);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (tile.content.type === 'calendar_date') {
                // Red banner at top
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(14, 14, 228, 50);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px sans-serif';
                ctx.fillText('CAL', 128, 39);

                const parts = tile.content.value.split(' ');
                const dayStr = parts[0] || '';
                const monthStr = parts[1] || '';

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 80px sans-serif';
                ctx.fillText(dayStr, 128, 125);

                ctx.fillStyle = '#f87171';
                ctx.font = 'bold 36px sans-serif';
                ctx.fillText(monthStr, 128, 195);
            } else if (tile.content.type === 'clock_time') {
                ctx.fillStyle = 'rgba(52, 211, 153, 0.4)';
                ctx.font = 'bold 24px sans-serif';
                ctx.fillText('HORA', 128, 65);

                ctx.fillStyle = '#34d399';
                ctx.shadowColor = 'rgba(52, 211, 153, 0.6)';
                ctx.shadowBlur = 15;
                ctx.font = 'bold 64px monospace';
                ctx.fillText(tile.content.value, 128, 145);
                ctx.shadowBlur = 0; // Reset
            } else {
                if (tile.content.type === 'bottle_message') {
                    ctx.font = 'bold 120px sans-serif';
                    ctx.fillText('🍾', 128, 128);
                } else if (tile.content.type === 'drawing_tile') {
                    ctx.font = 'bold 92px sans-serif';
                    const icon = tile.content.value === 'draw' ? '✏️' : '🖼️';
                    ctx.fillText(icon, 128, 128);
                } else {
                    // Apply mirror transform before drawing emoji
                    if (mirrorVariant) {
                        ctx.save();
                        ctx.translate(128, 128);
                        if (mirrorVariant === 'flipX') ctx.scale(-1, 1);
                        else if (mirrorVariant === 'flipY') ctx.scale(1, -1);
                        else if (mirrorVariant === 'rot90') ctx.rotate(Math.PI / 2);
                        else if (mirrorVariant === 'rot270') ctx.rotate(-Math.PI / 2);
                        ctx.translate(-128, -128);
                    }
                    const emoji = tile.content.value;
                    const code = emoji.codePointAt(0) || 0;
                    const isTrad = code >= 0x1F000 && code <= 0x1F029;

                    if (isTrad) {
                        if (code >= 0x1F000 && code <= 0x1F003) {
                            // Winds: 🀀 (East) to 🀃 (North)
                            const windChars = ["東", "南", "西", "北"];
                            const windStr = windChars[code - 0x1F000];
                            ctx.fillStyle = accentColor;
                            ctx.font = 'bold 140px sans-serif';
                            ctx.fillText(windStr, 128, 128);
                        } else if (code === 0x1F004) {
                            // Red Dragon: 🀄 (中)
                            ctx.fillStyle = '#ff4b4b';
                            ctx.font = 'bold 140px sans-serif';
                            ctx.fillText('中', 128, 128);
                        } else if (code === 0x1F005) {
                            // Green Dragon: 🀅 (發)
                            ctx.fillStyle = '#39ff14';
                            ctx.font = 'bold 140px sans-serif';
                            ctx.fillText('發', 128, 128);
                        } else if (code === 0x1F006) {
                            // White Dragon: 🀆
                            ctx.strokeStyle = '#00ccff';
                            ctx.lineWidth = 10;
                            ctx.strokeRect(50, 50, 156, 156);
                            ctx.lineWidth = 4;
                            ctx.strokeRect(62, 62, 132, 132);
                        } else if (code >= 0x1F007 && code <= 0x1F00F) {
                            // Characters: 🀇 (1) to 🀏 (9)
                            const nums = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
                            const numStr = nums[code - 0x1F007];
                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 64px sans-serif';
                            ctx.fillText(numStr, 128, 80);
                            ctx.fillStyle = '#ff4b89'; // Fuchsia accent
                            ctx.font = 'bold 54px sans-serif';
                            ctx.fillText('萬', 128, 172);
                        } else if (code >= 0x1F010 && code <= 0x1F018) {
                            // Bamboos: 🀐 (1) to 🀘 (9)
                            const count = code - 0x1F010 + 1;
                            if (count === 1) {
                                ctx.font = 'bold 140px sans-serif';
                                ctx.fillText('🦚', 128, 128);
                            } else {
                                const drawStick = (sx: number, sy: number, sw: number, sh: number, color: string) => {
                                    ctx.fillStyle = color;
                                    ctx.beginPath();
                                    if (ctx.roundRect) {
                                        ctx.roundRect(sx, sy, sw, sh, sw / 2);
                                    } else {
                                        ctx.rect(sx, sy, sw, sh);
                                    }
                                    ctx.fill();
                                    ctx.fillStyle = '#0a0a0a';
                                    ctx.fillRect(sx, sy + sh / 2 - 2, sw, 4);
                                };

                                const greenColor = '#39ff14';
                                const redColor = '#ff4b4b';

                                if (count === 2) {
                                    drawStick(100, 73, 18, 110, greenColor);
                                    drawStick(138, 73, 18, 110, greenColor);
                                } else if (count === 3) {
                                    drawStick(119, 50, 18, 70, greenColor);
                                    drawStick(85, 130, 18, 70, greenColor);
                                    drawStick(153, 130, 18, 70, greenColor);
                                } else if (count === 4) {
                                    drawStick(85, 50, 18, 70, greenColor);
                                    drawStick(153, 50, 18, 70, greenColor);
                                    drawStick(85, 130, 18, 70, greenColor);
                                    drawStick(153, 130, 18, 70, greenColor);
                                } else if (count === 5) {
                                    drawStick(85, 50, 18, 70, greenColor);
                                    drawStick(153, 50, 18, 70, greenColor);
                                    drawStick(119, 90, 18, 70, redColor);
                                    drawStick(85, 130, 18, 70, greenColor);
                                    drawStick(153, 130, 18, 70, greenColor);
                                } else if (count === 6) {
                                    drawStick(80, 50, 18, 70, greenColor);
                                    drawStick(119, 50, 18, 70, greenColor);
                                    drawStick(158, 50, 18, 70, greenColor);
                                    drawStick(80, 130, 18, 70, greenColor);
                                    drawStick(119, 130, 18, 70, greenColor);
                                    drawStick(158, 130, 18, 70, greenColor);
                                } else if (count === 7) {
                                    drawStick(119, 40, 18, 58, redColor);
                                    drawStick(80, 108, 18, 58, greenColor);
                                    drawStick(119, 108, 18, 58, greenColor);
                                    drawStick(158, 108, 18, 58, greenColor);
                                    drawStick(80, 176, 18, 58, greenColor);
                                    drawStick(119, 176, 18, 58, greenColor);
                                    drawStick(158, 176, 18, 58, greenColor);
                                } else if (count === 8) {
                                    drawStick(75, 50, 18, 70, greenColor);
                                    drawStick(104, 50, 18, 70, greenColor);
                                    drawStick(134, 50, 18, 70, greenColor);
                                    drawStick(163, 50, 18, 70, greenColor);
                                    drawStick(75, 130, 18, 70, greenColor);
                                    drawStick(104, 130, 18, 70, greenColor);
                                    drawStick(134, 130, 18, 70, greenColor);
                                    drawStick(163, 130, 18, 70, greenColor);
                                } else if (count === 9) {
                                    for (let r = 0; r < 3; r++) {
                                        drawStick(80, 45 + r * 60, 18, 52, greenColor);
                                        drawStick(119, 45 + r * 60, 18, 52, redColor);
                                        drawStick(158, 45 + r * 60, 18, 52, greenColor);
                                    }
                                }
                            }
                        ctx.restore();
                            } else if (code >= 0x1F019 && code <= 0x1F021) {
                            // Dots (Circles): 🀙 (1) to 🀡 (9)
                            const count = code - 0x1F019 + 1;
                            ctx.save();
                            ctx.translate(128, 128);
                            ctx.scale(1.4, 1.4);
                            ctx.translate(-128, -128);
                            const drawDot = (cx: number, cy: number, r: number, color: string) => {
                                ctx.fillStyle = color;
                                ctx.beginPath();
                                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.strokeStyle = '#0a0a0a';
                                ctx.lineWidth = Math.max(2, r * 0.15);
                                ctx.stroke();
                                ctx.fillStyle = '#ffffff';
                                ctx.beginPath();
                                ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.2, 0, Math.PI * 2);
                                ctx.fill();
                            };

                            const red = '#ff4b4b';
                            const green = '#39ff14';
                            const blue = '#00ccff';

                            if (count === 1) {
                                drawDot(128, 128, 48, red);
                            } else if (count === 2) {
                                drawDot(95, 95, 28, blue);
                                drawDot(161, 161, 28, green);
                            } else if (count === 3) {
                                drawDot(80, 80, 24, blue);
                                drawDot(128, 128, 24, red);
                                drawDot(176, 176, 24, green);
                            } else if (count === 4) {
                                drawDot(85, 85, 22, blue);
                                drawDot(171, 85, 22, green);
                                drawDot(85, 171, 22, green);
                                drawDot(171, 171, 22, blue);
                            } else if (count === 5) {
                                drawDot(85, 85, 20, blue);
                                drawDot(171, 85, 20, green);
                                drawDot(128, 128, 22, red);
                                drawDot(85, 171, 20, green);
                                drawDot(171, 171, 20, blue);
                            } else if (count === 6) {
                                drawDot(85, 65, 18, green);
                                drawDot(171, 65, 18, green);
                                drawDot(85, 128, 18, red);
                                drawDot(171, 128, 18, red);
                                drawDot(85, 191, 18, red);
                                drawDot(171, 191, 18, red);
                            } else if (count === 7) {
                                drawDot(70, 55, 16, green);
                                drawDot(128, 75, 16, green);
                                drawDot(186, 95, 16, green);
                                drawDot(85, 150, 16, red);
                                drawDot(171, 150, 16, red);
                                drawDot(85, 205, 16, blue);
                                drawDot(171, 205, 16, blue);
                            } else if (count === 8) {
                                for (let r = 0; r < 4; r++) {
                                    drawDot(85, 55 + r * 48, 16, blue);
                                    drawDot(171, 55 + r * 48, 16, blue);
                                }
                            } else if (count === 9) {
                                for (let r = 0; r < 3; r++) {
                                    drawDot(75, 65 + r * 63, 16, green);
                                    drawDot(128, 65 + r * 63, 16, red);
                                    drawDot(181, 65 + r * 63, 16, blue);
                                }
                            }
                        ctx.restore();
                        } else if (code >= 0x1F022 && code <= 0x1F029) {
                            const flowerEmojis: Record<number, string> = {
                                0x1F022: "🌸", 0x1F023: "☀️", 0x1F024: "🍁", 0x1F025: "❄️",
                                0x1F026: "🌺", 0x1F027: "🪻", 0x1F028: "🎋", 0x1F029: "🌼"
                            };
                            const flEmoji = flowerEmojis[code] || emoji;
                            ctx.font = 'bold 130px sans-serif';
                            ctx.fillText(flEmoji, 128, 128);
                        }
                    } else {
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 120px sans-serif';
                        ctx.fillText(emoji, 128, 128);
                    }
                }
            }
                    if (mirrorVariant) {
                        ctx.restore();
                    }

            // Draw hardening overlays on top of the content
            if (tile.isLocked) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
                ctx.fillRect(14, 14, 228, 228);
                ctx.font = 'bold 80px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🔒', 128, 128);
            }
            if (tile.isBomb && tile.bombTimer !== undefined) {
                // Red danger border
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 6;
                ctx.strokeRect(6, 6, 244, 244);
                // Bomb icon
                ctx.font = 'bold 48px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💣', 210, 46);
                // Timer text
                ctx.fillStyle = '#ff0000';
                ctx.font = 'bold 32px monospace';
                ctx.fillText(`${tile.bombTimer}s`, 210, 86);
            }
            if (tile.iceCounter && tile.iceCounter > 0) {
                ctx.fillStyle = 'rgba(135, 206, 250, 0.45)';
                ctx.fillRect(14, 14, 228, 228);
                // Ice crystal border
                ctx.strokeStyle = '#87ceeb';
                ctx.lineWidth = 4;
                ctx.strokeRect(10, 10, 236, 236);
                // Counter badge
                ctx.fillStyle = '#003366';
                ctx.beginPath();
                ctx.arc(210, 46, 22, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#87ceeb';
                ctx.font = 'bold 24px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${tile.iceCounter}`, 210, 46);
                // Snowflake
                ctx.font = 'bold 36px sans-serif';
                ctx.fillText('❄️', 46, 46);
            }
            if (tile.isSmoked) {
                ctx.fillStyle = 'rgba(30, 30, 30, 0.7)';
                ctx.fillRect(14, 14, 228, 228);
                ctx.font = 'bold 52px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💨', 128, 128);
            }

            const tex = createTileTexture(canvas);
            setCachedTileTexture(key, tex);
            if (active) setTexture(tex);
        } else {
            // Cargar imagen personalizada (Supabase o Local), deduplicando cargas
            // iguales para que las dos fichas del par compartan una sola textura.
            let pending = pendingTileTextures.get(key);
            if (!pending) {
                pending = new Promise<THREE.CanvasTexture>((resolve) => {
                    const img = new Image();
                    const isLocal = tile.content.value.startsWith('/');

                    // Definir handlers ANTES de establecer src para evitar carreras por caché
                    img.onload = () => {
                        // Redibujar fondo
                        if (isGolden) {
                            const goldGrad = ctx.createLinearGradient(0, 0, 256, 256);
                            goldGrad.addColorStop(0, '#ffe57f');
                            goldGrad.addColorStop(0.4, '#ffea9f');
                            goldGrad.addColorStop(0.7, '#ffd700');
                            goldGrad.addColorStop(1, '#b29300');
                            ctx.fillStyle = goldGrad;
                            ctx.fillRect(0, 0, 256, 256);
                        } else {
                            ctx.fillStyle = '#0a0a0a';
                            ctx.fillRect(0, 0, 256, 256);
                        }

                        // Dibujar imagen 'contain' ajustada para contrarrestar el estiramiento 3D
                        const margin = 26; // Mayor margen para hacer la imagen más pequeña
                        const size = 256 - margin * 2; // 204

                        const correctionFactor = TILE_FACE_HEIGHT / TILE_FACE_WIDTH;
                        const imgAspect = img.width / img.height;
                        const targetCanvasAspect = imgAspect * correctionFactor;

                        let drawW = size;
                        let drawH = size;
                        let drawX = margin;
                        let drawY = margin;

                        if (targetCanvasAspect > 1) {
                            // Más ancho que alto -> reducimos altura
                            drawH = size / targetCanvasAspect;
                            drawY = margin + (size - drawH) / 2;
                        } else {
                            // Más alto que ancho -> reducimos anchura
                            drawW = size * targetCanvasAspect;
                            drawX = margin + (size - drawW) / 2;
                        }

                        ctx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, drawW, drawH);

                        // Aplicar el marco de borde y las marcas visuales por encima
                        drawBordersAndTicks(isGolden);

                        resolve(createTileTexture(canvas));
                    };

                    img.onerror = () => {
                        // Placeholder visual en caso de error
                        if (isGolden) {
                            const goldGrad = ctx.createLinearGradient(0, 0, 256, 256);
                            goldGrad.addColorStop(0, '#ffe57f');
                            goldGrad.addColorStop(0.7, '#ffd700');
                            goldGrad.addColorStop(1, '#b29300');
                            ctx.fillStyle = goldGrad;
                            ctx.fillRect(0, 0, 256, 256);
                        } else {
                            ctx.fillStyle = '#0a0a0a';
                            ctx.fillRect(0, 0, 256, 256);
                        }

                        drawBordersAndTicks(isGolden);

                        ctx.fillStyle = isGolden ? '#937500' : '#e74c3c';
                        ctx.font = 'bold 140px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(isGolden ? '✨' : '🖼️', 128, 128);

                        resolve(createTileTexture(canvas));
                    };

                    // Establecer src AL FINAL para iniciar la descarga de forma segura
                    if (!isLocal) {
                        img.src = `/api/proxy-image?url=${encodeURIComponent(tile.content.value)}`;
                    } else {
                        img.src = tile.content.value;
                    }
                });

                pendingTileTextures.set(key, pending);
                pending.then(tex => {
                    setCachedTileTexture(key, tex);
                    pendingTileTextures.delete(key);
                });
            }

            pending.then(tex => {
                if (active) setTexture(tex);
            });
        }

        // El caché es dueño de la textura; no se hace dispose por ficha.
        return () => {
            active = false;
        };
    }, [tile.content.value, tile.content.type, accentColor, mirrorVariant, tile.isLocked, tile.isBomb, tile.bombTimer, tile.iceCounter, tile.isSmoked]);

    return texture;
}

interface DyingInfo {
    id: string;
    start: number;
    collisionPos: [number, number, number];
    isDockTile: boolean;
}

interface Tile3DProps {
    tile: TileState;
    isFree: boolean;
    centerX: number;
    centerY: number;
    boardY: number;
    dockY: number;
    dockIds: string[];
    onSelect: (id: string) => void;
    isGhostSolid?: boolean;
    hasStarted: boolean;
    dyingInfo?: DyingInfo;
}

export function Tile3D({ tile, isFree, centerX, centerY, boardY, dockY, dockIds, onSelect, isGhostSolid, hasStarted, dyingInfo }: Tile3DProps) {
    const { profile } = useProfile();
    const meshRef = useRef<THREE.Group>(null);
    const frontMeshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    // Colores de acento según perfil
    const rawAccentColor = profile === 'ella' ? '#ff4b89' : '#e1ff80'; // Fucsia o Neón
    const backColor = profile === 'ella' ? '#c83b6b' : '#a1c24a';       // Capa trasera del Mahjong

    const texture = useTileTexture(tile, rawAccentColor, tile.isMirrored);
    const isGolden = tile.content.type === 'custom';

    // Spacing en 3D para mapear el grid discreto. Las fichas ahora son más verticales
    // y el eje Z separa más las capas para que la pila se lea con profundidad real.
    const spacingX = 0.43;
    const spacingY = 0.59;
    const spacingZ = 0.62;

    // Calcular posición base en el tablero
    const posX = (tile.x - centerX) * spacingX;
    const posY = boardY - (tile.y - centerY) * spacingY;
    const baseZ = tile.z * spacingZ;

    // Detectar si la ficha está en el dock y obtener su índice
    const dockIndex = dockIds.indexOf(tile.id);
    const isInDock = dockIndex !== -1;
    const dying = !!dyingInfo;
    const isBright = isFree || isInDock || dying; // Las fichas en el dock/destruyéndose no deben verse opacas
    const isFlipped = !!tile.isFlippedDown && !isInDock;
    const isBlackSpot = isFlipped && !isFree;

    // Calcular posición final objetivo (target)
    let targetX = posX;
    let targetY = posY;
    let targetZ = baseZ + (tile.isSelected ? 0.28 : hovered && isFree ? 0.08 : 0);

    if (isInDock) {
        // Posicionamiento de slots en el Dock 3D al tope de la pantalla
        targetX = (dockIndex - 1) * 1.30; // Centrado en X con espacio de 1.30 unidades para las fichas más anchas
        targetY = dockY;                  // Ubicación al tope del tablero
        targetZ = 0.25;                   // Leve elevación
    }

    // Animación suave usando LERP por frame

    const entryDelayRef = useRef(0);
    const startTimeRef = useRef<number | null>(null);
    const wasInDockRef = useRef(false);
    const dockMoveRef = useRef<{
        active: boolean;
        start: number;
        from: [number, number, number];
        to: [number, number, number];
    }>({ active: false, start: 0, from: [0, 0, 0], to: [0, 0, 0] });
    // Captura la posición de partida del choque en el primer frame de destrucción
    const dyingFromRef = useRef<{ start: number; from: [number, number, number] }>({ start: -1, from: [0, 0, 0] });
    useEffect(() => {
        if (meshRef.current && !hasStarted) {
            const numericId = Number(tile.id.replace(/\D/g, '')) || 0;
            entryDelayRef.current = (numericId % 16) * 0.018 + tile.z * 0.045;
            // Set starting position high up with enough rotation to make the deal feel physical.
            meshRef.current.position.set(
                posX + (Math.random() - 0.5) * 9,
                posY + (Math.random() - 0.5) * 9,
                baseZ + 18 + Math.random() * 12
            );
            meshRef.current.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            meshRef.current.scale.setScalar(0.18);
        }
    }, [hasStarted, posX, posY, baseZ, tile.id, tile.z]);

    useEffect(() => {
        if (hasStarted) {
            startTimeRef.current = null;
        }
    }, [hasStarted]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Limitar delta para evitar saltos bruscos en caídas de frame
        const safeDelta = Math.min(delta, 0.1);
        const time = state.clock.elapsedTime;
        if (hasStarted && startTimeRef.current === null) {
            startTimeRef.current = time;
        }

        // ─── CHOQUE Y DESTRUCCIÓN EN EL DOCK ───
        if (dyingInfo) {
            const SLAM = 0.30;   // s: vuelo acelerado hacia el punto de impacto
            const IMPACT = 0.18; // s: aplastamiento y colapso
            const [cx, cy, cz] = dyingInfo.collisionPos;
            const elapsed = (performance.now() - dyingInfo.start) / 1000;

            // Guardar la posición de partida una sola vez por choque.
            // La ficha que ya estaba en el dock arranca en su ranura (espera el impacto);
            // la ficha del tablero vuela desde su posición hacia el dock.
            if (dyingFromRef.current.start !== dyingInfo.start) {
                const startFrom: [number, number, number] = dyingInfo.isDockTile
                    ? [cx, cy, cz]
                    : [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z];
                dyingFromRef.current = { start: dyingInfo.start, from: startFrom };
                if (dyingInfo.isDockTile) {
                    meshRef.current.position.set(cx, cy, cz);
                }
            }
            const from = dyingFromRef.current.from;

            if (elapsed < SLAM) {
                const t = elapsed / SLAM;
                const eased = t * t * t; // aceleración fuerte (embestida)
                meshRef.current.position.set(
                    THREE.MathUtils.lerp(from[0], cx, eased),
                    THREE.MathUtils.lerp(from[1], cy, eased),
                    THREE.MathUtils.lerp(from[2], cz, eased)
                );
                // Giro en el aire; las dos fichas rotan en sentidos opuestos
                meshRef.current.rotation.z += safeDelta * 7 * (dyingInfo.isDockTile ? -1 : 1);
                const s = 1 + eased * 0.14;
                meshRef.current.scale.set(s, s, s);
            } else {
                // Impacto: aplastar horizontalmente y colapsar a cero
                const t2 = Math.min(1, (elapsed - SLAM) / IMPACT);
                const k = 1 - t2;
                meshRef.current.position.set(cx, cy, cz);
                meshRef.current.scale.set(1.4 * k + 0.001, 0.45 * k + 0.001, k + 0.001);
                meshRef.current.rotation.z += safeDelta * 13;
            }

            // Destello caliente durante la destrucción
            if (frontMeshRef.current) {
                const mats = frontMeshRef.current.material as THREE.MeshStandardMaterial[];
                if (mats && mats.length >= 6) {
                    const flash = 0.6 + Math.sin(elapsed * 42) * 0.4;
                    mats.forEach(m => { if (m) m.opacity = 1; });
                    const fm = mats[4];
                    if (fm) {
                        fm.emissive.set('#ffb54d');
                        fm.emissiveIntensity = flash * 1.7;
                    }
                }
            }
            return;
        }

        if (isInDock && !wasInDockRef.current) {
            dockMoveRef.current = {
                active: true,
                start: time,
                from: [
                    meshRef.current.position.x,
                    meshRef.current.position.y,
                    meshRef.current.position.z
                ],
                to: [targetX, targetY, targetZ]
            };
        } else if (!isInDock && wasInDockRef.current) {
            dockMoveRef.current.active = false;
        }
        wasInDockRef.current = isInDock;

        // Si es una ficha dorada libre, flotar suavemente arriba y abajo
        if (isGolden && isFree && !isInDock) {
            targetZ += Math.sin(time * 4) * 0.04;
        }

        const elapsedSinceStart = hasStarted && startTimeRef.current !== null ? time - startTimeRef.current : 0;
        const entryDelay = hasStarted ? entryDelayRef.current : 0;
        const entryActive = hasStarted && elapsedSinceStart < entryDelay;
        const settleSpeed = entryActive ? 0.01 : (isInDock ? 10.5 : 10.5);

        if (dockMoveRef.current.active) {
            const move = dockMoveRef.current;
            const moveDuration = 0.54;
            const t = Math.min(1, (time - move.start) / moveDuration);
            const eased = 1 - Math.pow(1 - t, 3);
            const arc = Math.sin(t * Math.PI) * 0.72;
            const drift = Math.sin(t * Math.PI * 2) * 0.035;
            meshRef.current.position.set(
                THREE.MathUtils.lerp(move.from[0], move.to[0], eased),
                THREE.MathUtils.lerp(move.from[1], move.to[1], eased) + drift,
                THREE.MathUtils.lerp(move.from[2], move.to[2], eased) + arc
            );
            if (t >= 1) {
                dockMoveRef.current.active = false;
            }
        } else {
            // Interpolación LERP de posición en los 3 ejes (funciona para ir y volver del dock)
            meshRef.current.position.x = THREE.MathUtils.damp(meshRef.current.position.x, targetX, settleSpeed, safeDelta);
            meshRef.current.position.y = THREE.MathUtils.damp(meshRef.current.position.y, targetY, settleSpeed, safeDelta);
            meshRef.current.position.z = THREE.MathUtils.damp(meshRef.current.position.z, targetZ, settleSpeed, safeDelta);
        }

        // Rotación LERP (los del dock se alinean planos)
        const dockMoveActive = dockMoveRef.current.active;
        const targetRotX = isInDock ? (dockMoveActive ? -0.16 : 0) : tile.isSelected ? -0.1 : 0;
        
        let targetRotY = isInDock 
            ? (dockMoveActive ? 0.12 : 0)
            : isFlipped 
                ? Math.PI 
                : tile.isSelected 
                    ? 0.08 
                    : hovered && isFree 
                        ? 0.04 
                        : 0;
        
        // Si es dorada y seleccionada, aplicar un suave bamboleo de rotación
        if (isGolden && tile.isSelected) {
            targetRotY += Math.sin(time * 6) * 0.15;
        }

        meshRef.current.rotation.x = THREE.MathUtils.damp(meshRef.current.rotation.x, targetRotX, entryActive ? 0.01 : 8.5, safeDelta);
        meshRef.current.rotation.y = THREE.MathUtils.damp(meshRef.current.rotation.y, targetRotY, entryActive ? 0.01 : 8.5, safeDelta);
        meshRef.current.rotation.z = THREE.MathUtils.damp(meshRef.current.rotation.z, 0, entryActive ? 0.01 : 8, safeDelta);

        // LERP de escala
        const targetScale = hovered && isFree && !isInDock ? 1.035 : 1.0;
        meshRef.current.scale.setScalar(THREE.MathUtils.damp(meshRef.current.scale.x, targetScale, entryActive ? 0.01 : 11, safeDelta));

        // Animación de pulso luminiscente en el Mesh frontal
        if (frontMeshRef.current) {
            const materials = frontMeshRef.current.material as THREE.MeshStandardMaterial[];
            if (materials && materials.length >= 6) {
                // Material frontal (índice 4)
                const frontMat = materials[4];
                
                // Ghost tile opacity animation
                if (tile.isGhost && !isInDock) {
                    const ghostOpacity = isGhostSolid ? 1.0 : 0.2;
                    const currentOp = frontMat.opacity;
                    const lerpedOp = THREE.MathUtils.damp(currentOp, ghostOpacity, 5, safeDelta);
                    materials.forEach(m => { if (m) m.opacity = lerpedOp; });
                } else {
                    materials.forEach(m => { if (m) m.opacity = isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.45); });
                }

                if (tile.isBomb && !tile.isMatched) {
                    // Pulsing red danger glow for bombs
                    const bombPulse = Math.sin(time * 6) * 0.4 + 0.5;
                    frontMat.emissive.set('#ff0000');
                    frontMat.emissiveIntensity = bombPulse;
                } else if (tile.isHinted) {
                    const clockTime = state.clock.elapsedTime;
                    const pulse = Math.sin(clockTime * 9) * 0.35 + 0.35;
                    frontMat.emissive.set(rawAccentColor);
                    frontMat.emissiveIntensity = pulse;
                } else if (tile.isSelected) {
                    frontMat.emissive.set(rawAccentColor);
                    frontMat.emissiveIntensity = 0.25;
                } else if (tile.isGhost && !isGhostSolid && !isInDock) {
                    // Cyan glow when ghost is translucent
                    frontMat.emissive.set('#00ffff');
                    frontMat.emissiveIntensity = 0.3;
                } else if (tile.iceCounter && tile.iceCounter > 0) {
                    // Subtle blue emissive for iced tiles
                    const icePulse = Math.sin(time * 2) * 0.1 + 0.15;
                    frontMat.emissive.set('#87ceeb');
                    frontMat.emissiveIntensity = icePulse;
                } else if (isGolden && isFree && !isInDock) {
                    const shimmer = Math.sin(time * 3) * 0.12 + 0.18;
                    frontMat.emissive.set('#e5c100');
                    frontMat.emissiveIntensity = shimmer;
                } else {
                    frontMat.emissiveIntensity = 0;
                }
            }
        }
    });

    // Cambiar cursor al hacer hover
    useEffect(() => {
        if (hovered && isFree) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'auto';
        }
        return () => {
            document.body.style.cursor = 'auto';
        };
    }, [hovered, isFree]);

    return (
        <group
            ref={meshRef}
            position={[posX, posY, baseZ]}
            onPointerOver={(e) => {
                e.stopPropagation();
                if (isFree) setHovered(true);
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                setHovered(false);
            }}
            onPointerDown={(e) => {
                e.stopPropagation();
                if (isFree) {
                    onSelect(tile.id);
                }
            }}
        >
            {/* 1. PLACA TRASERA DE ACCENTO / SOPORTE */}
            <mesh
                castShadow={isBright && !isBlackSpot}
                receiveShadow={true}
                position={[0, 0, -0.15]}
                geometry={BACK_GEOMETRY}
            >
                <meshStandardMaterial
                    color={isBlackSpot ? '#000000' : (isGolden ? '#ffd700' : isBright ? backColor : '#323232')}
                    roughness={isBlackSpot ? 1.0 : (isGolden ? 0.15 : 0.3)}
                    metalness={isBlackSpot ? 0.0 : (isGolden ? 0.95 : 0.3)}
                    transparent
                    opacity={isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.45)}
                />
            </mesh>

            {/* 2. PLACA FRONTAL (Mosaico de Juego principal) */}
            {/* Cara frontal con textura blanca/hueso para parecer ficha de mahjong real */}
            <mesh
                ref={frontMeshRef}
                castShadow={isBright && !isBlackSpot}
                receiveShadow={true}
                position={[0, 0, 0.15]}
                geometry={FRONT_GEOMETRY}
            >
                {/* Laterales (Índices 0-3): Color hueso/blanco */}
                <meshStandardMaterial
                    attach="material-0"
                    color={isBlackSpot ? '#000000' : (isGolden ? '#ffd700' : isBright ? '#fdfcf0' : '#dcdbc7')}
                    roughness={isBlackSpot ? 1.0 : (isGolden ? 0.15 : 0.4)}
                    metalness={isBlackSpot ? 0.0 : (isGolden ? 0.95 : 0.1)}
                    transparent
                    opacity={isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.45)}
                />
                <meshStandardMaterial
                    attach="material-1"
                    color={isBlackSpot ? '#000000' : (isGolden ? '#ffd700' : isBright ? '#fdfcf0' : '#dcdbc7')}
                    roughness={isBlackSpot ? 1.0 : (isGolden ? 0.15 : 0.4)}
                    metalness={isBlackSpot ? 0.0 : (isGolden ? 0.95 : 0.1)}
                    transparent
                    opacity={isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.45)}
                />
                <meshStandardMaterial
                    attach="material-2"
                    color={isBlackSpot ? '#000000' : (isGolden ? '#ffd700' : isBright ? '#fdfcf0' : '#dcdbc7')}
                    roughness={isBlackSpot ? 1.0 : (isGolden ? 0.15 : 0.4)}
                    metalness={isBlackSpot ? 0.0 : (isGolden ? 0.95 : 0.1)}
                    transparent
                    opacity={isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.45)}
                />
                <meshStandardMaterial
                    attach="material-3"
                    color={isBlackSpot ? '#000000' : (isGolden ? '#ffd700' : isBright ? '#fdfcf0' : '#dcdbc7')}
                    roughness={isBlackSpot ? 1.0 : (isGolden ? 0.15 : 0.4)}
                    metalness={isBlackSpot ? 0.0 : (isGolden ? 0.95 : 0.1)}
                    transparent
                    opacity={isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.45)}
                />
                
                {/* Cara Frontal (+Z, Índice 4): Textura con el símbolo o foto */}
                <meshStandardMaterial
                    key={texture ? 'loaded' : 'loading'}
                    attach="material-4"
                    map={isBlackSpot ? undefined : (texture || undefined)}
                    color={isBlackSpot ? '#000000' : (isBright ? '#ffffff' : '#dcdbc7')}
                    roughness={isBlackSpot ? 1.0 : 0.15}
                    metalness={isBlackSpot ? 0.0 : (isGolden ? 0.5 : 0.05)}
                    transparent
                    opacity={isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.4)}
                />

                {/* Cara Trasera (-Z, Índice 5): Igual al borde */}
                <meshStandardMaterial
                    attach="material-5"
                    color={isBlackSpot ? '#000000' : (isGolden ? '#ffd700' : isBright ? '#fdfcf0' : '#dcdbc7')}
                    roughness={isBlackSpot ? 1.0 : (isGolden ? 0.15 : 0.4)}
                    metalness={isBlackSpot ? 0.0 : (isGolden ? 0.95 : 0.1)}
                    transparent
                    opacity={isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.45)}
                />
            </mesh>
        </group>
    );
}
