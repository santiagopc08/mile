import { TankGameState } from './types';
import { V_WIDTH, V_HEIGHT, BOARD_X, BOARD_Y, MAP_COLS, MAP_ROWS, TILE_SIZE, DIR_VECTORS } from './constants';

export function renderGameScene(ctx: CanvasRenderingContext2D, s: TankGameState, crtEnabled: boolean) {
    ctx.save();
    ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

    if (s.shakeIntensity > 0) {
        const ox = (Math.random() * 2 - 1) * s.shakeIntensity;
        const oy = (Math.random() * 2 - 1) * s.shakeIntensity;
        ctx.translate(ox, oy);
    }

    // Dark Ground
    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // Playfield Background
    ctx.fillStyle = '#0a0d1e';
    ctx.fillRect(BOARD_X, BOARD_Y, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);

    // Map Tiles
    for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
            const px = BOARD_X + c * TILE_SIZE;
            const py = BOARD_Y + r * TILE_SIZE;
            const t = s.map[r][c];

            if (t === 'brick') {
                ctx.fillStyle = '#c2410c';
                ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                // Brick pattern
                ctx.fillStyle = '#ea580c';
                ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE / 2 - 4);
                ctx.fillRect(px + 3, py + TILE_SIZE / 2 + 1, TILE_SIZE - 6, TILE_SIZE / 2 - 4);
            } else if (t === 'steel') {
                ctx.fillStyle = '#64748b';
                ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            } else if (t === 'water') {
                ctx.fillStyle = '#0284c7';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            } else if (t === 'baseCore') {
                ctx.fillStyle = '#f59e0b';
                ctx.shadowColor = '#f59e0b';
                ctx.shadowBlur = 12;
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🦅 HQ', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
                ctx.shadowBlur = 0;
            } else if (t === 'baseDestroyed') {
                ctx.fillStyle = '#334155';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💥 XX', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
            }
        }
    }

    // Power-Ups
    s.powerUps.forEach(p => {
        if (p.active) {
            ctx.save();
            ctx.fillStyle = '#facc15';
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 12;
            ctx.fillRect(p.x + 3, p.y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.type === 'star' ? '⭐' : p.type === 'shield' ? '🛡️' : p.type === 'bomb' ? '💣' : p.type === 'freeze' ? '⏱️' : '🧱', p.x + TILE_SIZE / 2, p.y + TILE_SIZE / 2);
            ctx.restore();
        }
    });

    // Enemy Tanks
    s.enemies.forEach(e => {
        if (e.active) {
            ctx.save();
            const col = e.hasPowerUp ? '#facc15' : e.enemyType === 'heavy' ? '#ef4444' : e.enemyType === 'assault' ? '#ec4899' : '#00f0ff';
            ctx.fillStyle = col;
            ctx.shadowColor = col;
            ctx.shadowBlur = 8;
            ctx.fillRect(e.x + 2, e.y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

            // Barrel
            const center = { x: e.x + TILE_SIZE / 2, y: e.y + TILE_SIZE / 2 };
            const dVec = DIR_VECTORS[e.dir];
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(center.x, center.y);
            ctx.lineTo(center.x + dVec.x * (TILE_SIZE * 0.48), center.y + dVec.y * (TILE_SIZE * 0.48));
            ctx.stroke();
            ctx.restore();
        }
    });

    // Player Tank
    if (s.player.active) {
        ctx.save();
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 10;
        ctx.fillRect(s.player.x + 2, s.player.y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

        // Barrel
        const center = { x: s.player.x + TILE_SIZE / 2, y: s.player.y + TILE_SIZE / 2 };
        const dVec = DIR_VECTORS[s.player.dir];
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(center.x + dVec.x * (TILE_SIZE * 0.5), center.y + dVec.y * (TILE_SIZE * 0.5));
        ctx.stroke();

        // Shield Bubble
        if (s.player.shieldTimer > 0) {
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(center.x, center.y, TILE_SIZE * 0.65, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Bullets
    s.bullets.forEach(b => {
        if (b.active) {
            ctx.save();
            ctx.fillStyle = b.fromPlayer ? '#facc15' : '#ef4444';
            ctx.shadowColor = b.fromPlayer ? '#facc15' : '#ef4444';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    });

    // Forest Canopy (Rendered over tanks for stealth)
    for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
            if (s.map[r][c] === 'forest') {
                ctx.fillStyle = 'rgba(22, 163, 74, 0.75)';
                ctx.fillRect(BOARD_X + c * TILE_SIZE, BOARD_Y + r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
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
}
