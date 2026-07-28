import { CameraSystem } from '../camera/cameraSystem';
import { Vehicle } from '../entities/vehicle';
import { VehicleController } from '../controllers/vehicleController';
import { TerrainSegment } from '../terrain/terrainManager';
import { Coin } from '../entities/coin';
import { FuelCanister } from '../entities/fuelCanister';
import { Particle } from '../particles/particleSystem';
import { StrutTelemetry } from '../physics/suspensionSystem';
import { GAME_CONFIG } from '../config';

export interface RenderFrame {
    camera: CameraSystem;
    vehicle: Vehicle | null;
    segments: TerrainSegment[];
    coins: Coin[];
    canisters: FuelCanister[];
    particles: Particle[];
    controller: VehicleController | null;
    timeSec: number;
    fuel: number;
    debug: boolean;
    suspension: StrutTelemetry[];
}

const C = GAME_CONFIG.COLORS;

/** Hash determinista → [0,1). Da variación estable sin guardar estado. */
function hash01(n: number): number {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
}

/** Perfil de cresta continuo e infinito (suma de senos inconmensurables). */
function ridge(x: number, phase: number): number {
    return (
        Math.sin(x * 0.0013 + phase) * 0.6 +
        Math.sin(x * 0.0031 + phase * 1.7) * 0.28 +
        Math.sin(x * 0.0073 + phase * 2.3) * 0.12
    );
}

export class GameRenderer {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;

    private viewWidth = 1280;
    private viewHeight = 720;
    private dpr = 1;
    private accent = '#c3f400';

    private skyCache: { key: string; grad: CanvasGradient } | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('No se pudo obtener el contexto 2D del canvas');
        this.ctx = ctx;
        this.resize(canvas.clientWidth || 1280, canvas.clientHeight || 720, 1);
    }

    public setAccentColor(color: string) {
        this.accent = color;
    }

    /**
     * Ajusta el búfer del canvas a la densidad de pantalla. A partir de aquí todo
     * se dibuja en píxeles CSS y la matriz base se encarga del escalado.
     */
    public resize(cssWidth: number, cssHeight: number, dpr: number) {
        this.viewWidth = Math.max(1, Math.round(cssWidth));
        this.viewHeight = Math.max(1, Math.round(cssHeight));
        this.dpr = Math.min(dpr || 1, 2.5);

        this.canvas.width = Math.round(this.viewWidth * this.dpr);
        this.canvas.height = Math.round(this.viewHeight * this.dpr);
        this.skyCache = null;
    }

    public render(frame: RenderFrame) {
        const { camera, vehicle, timeSec } = frame;
        const ctx = this.ctx;
        const w = this.viewWidth;
        const h = this.viewHeight;

        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;

        const camX = Number.isFinite(camera.x) ? camera.x : 0;
        const camY = Number.isFinite(camera.y) ? camera.y : 0;
        const zoom = camera.zoom;

        // Y de pantalla donde queda el nivel base del terreno: ancla el cielo y
        // las montañas para que acompañen al movimiento vertical de la cámara.
        const horizonY = (GAME_CONFIG.TERRAIN.baseHeight - camY) * zoom;

        // --- FONDO (espacio de pantalla, con parallax) ---
        this.drawSky(w, h, horizonY);
        this.drawStars(w, horizonY, camX);
        this.drawSun(w, horizonY, camX);
        this.drawClouds(w, horizonY, camX, timeSec);
        this.drawMountainRange(w, h, horizonY, camX, 0.12, 210, C.MOUNTAIN_FAR, 3.1, 0.55);
        this.drawMountainRange(w, h, horizonY, camX, 0.24, 150, C.MOUNTAIN_MID, 7.4, 0.75);
        this.drawMountainRange(w, h, horizonY, camX, 0.42, 96, C.HILL_NEAR, 11.9, 0.92);

        // --- MUNDO ---
        const shake = camera.getShakeOffset();
        ctx.save();
        ctx.scale(zoom, zoom);
        ctx.translate(-camX + shake.x, -camY + shake.y);

        const viewLeft = camX - 80;
        const viewRight = camX + camera.worldWidth + 80;

        this.drawTerrain(frame.segments, viewLeft, viewRight, camY + camera.worldHeight);
        this.drawDecorations(frame.segments, viewLeft, viewRight);
        this.drawCanisters(frame.canisters, timeSec, viewLeft, viewRight);
        this.drawCoins(frame.coins, timeSec, viewLeft, viewRight);
        this.drawParticles(frame.particles);

        if (vehicle) {
            this.drawVehicle(vehicle, frame.controller, frame.segments, timeSec);
        }

        if (frame.debug && vehicle) {
            this.drawDebugOverlay(vehicle);
        }

        ctx.restore();

        if (frame.debug) this.drawSuspensionTelemetry(frame.suspension);

        // --- CAPAS DE PANTALLA ---
        if (vehicle) this.drawSpeedLines(w, h, vehicle, timeSec);
        this.drawVignette(w, h);
        this.drawLowFuelWarning(w, h, frame.fuel, timeSec);
    }

    // ==================================================================
    // FONDO
    // ==================================================================

    private drawSky(w: number, h: number, horizonY: number) {
        const ctx = this.ctx;
        const anchor = Math.round(horizonY / 20) * 20;
        const key = `${w}x${h}:${anchor}`;

        if (!this.skyCache || this.skyCache.key !== key) {
            const top = anchor - 1000;
            const grad = ctx.createLinearGradient(0, top, 0, anchor + 60);
            grad.addColorStop(0, C.SKY_TOP);
            grad.addColorStop(0.42, C.SKY_MID);
            grad.addColorStop(0.76, C.SKY_LOW);
            grad.addColorStop(1, C.SKY_HORIZON);
            this.skyCache = { key, grad };
        }

        ctx.fillStyle = C.SKY_TOP;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = this.skyCache.grad;
        ctx.fillRect(0, 0, w, h);
    }

    private drawStars(w: number, horizonY: number, camX: number) {
        const ctx = this.ctx;
        const offset = camX * 0.03;
        ctx.save();
        for (let i = 0; i < 70; i++) {
            const sx = (hash01(i * 3.7) * 2200 - offset) % 2200;
            const x = sx < 0 ? sx + 2200 : sx;
            if (x > w + 4) continue;

            const y = horizonY - 620 + hash01(i * 9.1) * 560;
            if (y < -10 || y > horizonY - 40) continue;

            // Se desvanecen al acercarse al horizonte iluminado
            const fade = Math.min(1, (horizonY - y) / 420);
            ctx.globalAlpha = fade * (0.25 + hash01(i * 5.3) * 0.7);
            ctx.fillStyle = '#fff6e8';
            const r = 0.7 + hash01(i * 2.9) * 1.3;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    private drawSun(w: number, horizonY: number, camX: number) {
        const ctx = this.ctx;
        const x = w * 0.74 - camX * 0.02;
        const y = horizonY - 210;
        const r = 54;

        ctx.save();
        const glow = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 6);
        glow.addColorStop(0, 'rgba(255,196,120,0.55)');
        glow.addColorStop(0.35, 'rgba(255,140,110,0.18)');
        glow.addColorStop(1, 'rgba(255,120,110,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);

        const disc = ctx.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r);
        disc.addColorStop(0, '#fff3d6');
        disc.addColorStop(0.6, C.SUN);
        disc.addColorStop(1, '#ff9f6a');
        ctx.fillStyle = disc;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    private drawClouds(w: number, horizonY: number, camX: number, timeSec: number) {
        const ctx = this.ctx;
        const offset = camX * 0.07 + timeSec * 5;

        ctx.save();
        for (let i = 0; i < 9; i++) {
            const span = 2600;
            let x = (hash01(i * 11.3) * span - offset) % span;
            if (x < 0) x += span;
            if (x > w + 260) continue;

            const y = horizonY - 340 + hash01(i * 4.1) * 250;
            const scale = 0.6 + hash01(i * 7.7) * 0.9;
            const alpha = 0.10 + hash01(i * 13.1) * 0.14;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = i % 2 === 0 ? '#ffd9c9' : '#e6c2e0';
            ctx.beginPath();
            ctx.ellipse(x, y, 78 * scale, 17 * scale, 0, 0, Math.PI * 2);
            ctx.ellipse(x + 42 * scale, y - 9 * scale, 50 * scale, 14 * scale, 0, 0, Math.PI * 2);
            ctx.ellipse(x - 40 * scale, y - 5 * scale, 42 * scale, 12 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    private drawMountainRange(
        w: number,
        h: number,
        horizonY: number,
        camX: number,
        parallax: number,
        amplitude: number,
        color: string,
        phase: number,
        baseAlpha: number
    ) {
        const ctx = this.ctx;
        const offset = camX * parallax;
        const baseY = horizonY + amplitude * 0.22;

        ctx.save();
        ctx.globalAlpha = baseAlpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-10, h + 10);

        for (let x = -10; x <= w + 10; x += 9) {
            const worldish = x + offset;
            ctx.lineTo(x, baseY - (ridge(worldish, phase) + 0.35) * amplitude);
        }

        ctx.lineTo(w + 10, h + 10);
        ctx.closePath();
        ctx.fill();

        // Bruma en la base de la cordillera, que la separa de la capa siguiente
        const haze = ctx.createLinearGradient(0, baseY - amplitude * 0.5, 0, baseY + amplitude * 0.5);
        haze.addColorStop(0, 'rgba(255,150,120,0)');
        haze.addColorStop(1, `rgba(255,150,120,${0.10 * baseAlpha})`);
        ctx.fillStyle = haze;
        ctx.fill();
        ctx.restore();
    }

    // ==================================================================
    // TERRENO
    // ==================================================================

    /**
     * Dibuja TODOS los chunks activos como un único polígono continuo.
     * Rellenarlos por separado dejaba costuras visibles entre chunk y chunk.
     */
    private drawTerrain(
        segments: TerrainSegment[],
        viewLeft: number,
        viewRight: number,
        bottomY: number
    ) {
        const ctx = this.ctx;

        const pts: { x: number; y: number }[] = [];
        for (const seg of segments) {
            if (!seg.surfacePoints || seg.surfacePoints.length < 2) continue;
            for (const p of seg.surfacePoints) {
                if (p.x < viewLeft || p.x > viewRight) continue;
                // Los chunks contiguos comparten vértice: evita duplicarlo
                const last = pts[pts.length - 1];
                if (last && Math.abs(last.x - p.x) < 0.01) continue;
                pts.push(p);
            }
        }
        if (pts.length < 2) return;

        const first = pts[0];
        const last = pts[pts.length - 1];
        const floorY = bottomY + 400;

        // 1. Relleno de tierra
        const soil = ctx.createLinearGradient(0, first.y - 40, 0, first.y + 420);
        soil.addColorStop(0, C.TERRAIN_SOIL_TOP);
        soil.addColorStop(0.45, '#33241a');
        soil.addColorStop(1, C.TERRAIN_SOIL_BOTTOM);

        ctx.beginPath();
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.lineTo(last.x, floorY);
        ctx.lineTo(first.x, floorY);
        ctx.closePath();
        ctx.fillStyle = soil;
        ctx.fill();

        // 2. Estratos y guijarros (deterministas: no parpadean entre frames)
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = 'rgba(0,0,0,0.16)';
        ctx.lineWidth = 2;
        for (let band = 1; band <= 3; band++) {
            ctx.beginPath();
            const drop = band * 46;
            ctx.moveTo(first.x, first.y + drop);
            for (let i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i].x, pts[i].y + drop + Math.sin(pts[i].x * 0.01 + band) * 5);
            }
            ctx.stroke();
        }

        const startCell = Math.floor(viewLeft / 55);
        const endCell = Math.ceil(viewRight / 55);
        for (let cell = startCell; cell <= endCell; cell++) {
            const r1 = hash01(cell * 1.7);
            if (r1 > 0.55) continue;
            const px = cell * 55 + r1 * 40;
            const idx = Math.round((px - first.x) / Math.max(1, pts[1].x - pts[0].x));
            const base = pts[Math.max(0, Math.min(pts.length - 1, idx))];
            if (!base) continue;
            const py = base.y + 24 + hash01(cell * 5.3) * 150;
            ctx.fillStyle = hash01(cell * 3.1) > 0.5 ? 'rgba(0,0,0,0.22)' : 'rgba(255,220,180,0.07)';
            ctx.beginPath();
            ctx.ellipse(px, py, 3 + hash01(cell * 9.7) * 6, 2.5 + hash01(cell * 2.3) * 4, hash01(cell) * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 3. Franja de hierba: superficie desplazada hacia abajo
        const grassDepth = 15;
        ctx.beginPath();
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y + grassDepth);
        ctx.closePath();

        const grass = ctx.createLinearGradient(0, first.y - 6, 0, first.y + grassDepth + 6);
        grass.addColorStop(0, C.TERRAIN_GRASS);
        grass.addColorStop(1, C.TERRAIN_GRASS_DARK);
        ctx.fillStyle = grass;
        ctx.fill();

        // 4. Línea de borde iluminada
        ctx.beginPath();
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = '#c3ee6a';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // 5. Matas de hierba
        ctx.strokeStyle = C.TERRAIN_GRASS;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < pts.length - 1; i++) {
            const p = pts[i];
            const seedA = hash01(Math.round(p.x) * 0.37);
            if (seedA > 0.5) continue;
            const nx = pts[i + 1].x - p.x;
            const ny = pts[i + 1].y - p.y;
            const len = Math.hypot(nx, ny) || 1;
            const upX = ny / len;
            const upY = -nx / len;
            const blades = 2 + Math.floor(hash01(p.x * 1.9) * 2);
            for (let b = 0; b < blades; b++) {
                const t = (b + 0.5) / blades;
                const bx = p.x + nx * t;
                const by = p.y + ny * t;
                const height = 5 + hash01(p.x + b * 13) * 7;
                const lean = (hash01(p.x + b * 7) - 0.5) * 7;
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + upX * height + lean, by + upY * height);
                ctx.stroke();
            }
        }
        ctx.lineCap = 'butt';
    }

    private drawDecorations(segments: TerrainSegment[], viewLeft: number, viewRight: number) {
        const ctx = this.ctx;
        for (const seg of segments) {
            if (!seg.decorations) continue;
            for (const item of seg.decorations) {
                if (item.x < viewLeft || item.x > viewRight) continue;

                ctx.save();
                ctx.translate(item.x, item.y);
                ctx.rotate(item.slope);
                ctx.scale(item.scale, item.scale);

                switch (item.type) {
                    case 'tree': this.drawTree(item.variant); break;
                    case 'rock': this.drawRock(); break;
                    case 'bush': this.drawBush(); break;
                    case 'flower': this.drawFlower(item.variant); break;
                    case 'sign': this.drawSign(); break;
                    case 'fence': this.drawFence(); break;
                }

                ctx.restore();
            }
        }
    }

    private drawTree(variant: number) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(2, 1, 16, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4a3018';
        ctx.fillRect(-4, -42, 8, 43);
        ctx.fillStyle = '#5d3d20';
        ctx.fillRect(-4, -42, 3.5, 43);

        if (variant % 2 === 0) {
            // Conífera
            for (let i = 0; i < 3; i++) {
                const yOff = -32 - i * 17;
                const width = 30 - i * 7;
                ctx.fillStyle = i === 2 ? '#2f6b28' : '#25581f';
                ctx.beginPath();
                ctx.moveTo(0, yOff - 24);
                ctx.lineTo(-width, yOff);
                ctx.lineTo(width, yOff);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = 'rgba(160,220,110,0.20)';
                ctx.beginPath();
                ctx.moveTo(0, yOff - 24);
                ctx.lineTo(-width * 0.42, yOff);
                ctx.lineTo(0, yOff);
                ctx.closePath();
                ctx.fill();
            }
        } else {
            // Frondosa
            ctx.fillStyle = '#2c6b2a';
            ctx.beginPath();
            ctx.arc(0, -54, 23, 0, Math.PI * 2);
            ctx.arc(-15, -44, 15, 0, Math.PI * 2);
            ctx.arc(15, -44, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3d8a33';
            ctx.beginPath();
            ctx.arc(-7, -60, 14, 0, Math.PI * 2);
            ctx.arc(9, -57, 11, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private drawRock() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(0, 1, 14, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#5c5766';
        ctx.beginPath();
        ctx.moveTo(-13, 0);
        ctx.lineTo(-15, -9);
        ctx.lineTo(-6, -16);
        ctx.lineTo(7, -15);
        ctx.lineTo(13, -7);
        ctx.lineTo(11, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#7d7789';
        ctx.beginPath();
        ctx.moveTo(-6, -16);
        ctx.lineTo(7, -15);
        ctx.lineTo(2, -9);
        ctx.lineTo(-9, -10);
        ctx.closePath();
        ctx.fill();
    }

    private drawBush() {
        const ctx = this.ctx;
        ctx.fillStyle = '#1f5a24';
        ctx.beginPath();
        ctx.arc(-10, -8, 10, 0, Math.PI * 2);
        ctx.arc(0, -13, 12.5, 0, Math.PI * 2);
        ctx.arc(10, -8, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#357c31';
        ctx.beginPath();
        ctx.arc(-4, -16, 7.5, 0, Math.PI * 2);
        ctx.arc(5, -15, 6.5, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawFlower(variant: number) {
        const ctx = this.ctx;
        ctx.strokeStyle = '#2f6b28';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -11);
        ctx.stroke();

        const colors = ['#ffd84d', '#ff6fa5', '#8fd0ff'];
        ctx.fillStyle = colors[variant % colors.length];
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 2.5) {
            ctx.beginPath();
            ctx.arc(Math.cos(a) * 4, -11 + Math.sin(a) * 4, 3.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#fff8e0';
        ctx.beginPath();
        ctx.arc(0, -11, 2.2, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawSign() {
        const ctx = this.ctx;
        ctx.fillStyle = '#5d3d20';
        ctx.fillRect(-2.5, -24, 5, 24);
        ctx.fillStyle = this.accent;
        ctx.fillRect(-16, -38, 32, 17);
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-16, -38, 32, 17);
        ctx.fillStyle = '#12100f';
        ctx.font = 'bold 11px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▶▶', 0, -29);
        ctx.textBaseline = 'alphabetic';
    }

    private drawFence() {
        const ctx = this.ctx;
        ctx.fillStyle = '#6b4a28';
        ctx.fillRect(-13, -19, 4.5, 19);
        ctx.fillRect(8.5, -19, 4.5, 19);
        ctx.fillStyle = '#8a6236';
        ctx.fillRect(-15, -15, 30, 3.5);
        ctx.fillRect(-15, -8, 30, 3.5);
    }

    // ==================================================================
    // OBJETOS
    // ==================================================================

    private drawCoins(coins: Coin[], timeSec: number, viewLeft: number, viewRight: number) {
        const ctx = this.ctx;
        for (const coin of coins) {
            if (coin.x < viewLeft || coin.x > viewRight) continue;

            const spin = Math.cos(timeSec * 3.4 + coin.phase);
            const bob = Math.sin(timeSec * 2.2 + coin.phase) * 3.5;
            const rx = Math.max(1.5, Math.abs(spin) * 11);
            const cy = coin.y + bob;

            ctx.save();
            ctx.translate(coin.x, cy);

            ctx.shadowColor = 'rgba(255,205,60,0.75)';
            ctx.shadowBlur = 16;

            const grad = ctx.createLinearGradient(-rx, -11, rx, 11);
            grad.addColorStop(0, C.COIN_DARK);
            grad.addColorStop(0.45, '#ffe27a');
            grad.addColorStop(0.55, C.COIN);
            grad.addColorStop(1, C.COIN_DARK);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, 11, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(140,85,0,0.65)';
            ctx.lineWidth = 1.6;
            ctx.stroke();

            // Corazón interior: es un juego de pareja, no un banco
            if (rx > 5) {
                ctx.save();
                ctx.scale(Math.min(1, rx / 11), 1);
                ctx.fillStyle = 'rgba(160,95,0,0.55)';
                ctx.beginPath();
                ctx.moveTo(0, 4.2);
                ctx.bezierCurveTo(-6, -1, -3.4, -6.2, 0, -3.2);
                ctx.bezierCurveTo(3.4, -6.2, 6, -1, 0, 4.2);
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();
        }
    }

    private drawCanisters(canisters: FuelCanister[], timeSec: number, viewLeft: number, viewRight: number) {
        const ctx = this.ctx;
        for (const can of canisters) {
            if (can.x < viewLeft || can.x > viewRight) continue;

            const bob = Math.sin(timeSec * 2.6 + can.phase) * 2.2;

            ctx.save();
            ctx.translate(can.x, can.y + bob);
            ctx.rotate(can.angle);

            ctx.shadowColor = 'rgba(240,69,63,0.6)';
            ctx.shadowBlur = 14;

            // Cuerpo
            const body = ctx.createLinearGradient(-13, -16, 13, 16);
            body.addColorStop(0, '#ff6b5e');
            body.addColorStop(0.5, C.FUEL_CANISTER);
            body.addColorStop(1, '#a81f22');
            ctx.fillStyle = body;
            this.roundRect(-13, -16, 26, 32, 4);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.strokeStyle = 'rgba(70,10,10,0.7)';
            ctx.lineWidth = 2;
            this.roundRect(-13, -16, 26, 32, 4);
            ctx.stroke();

            // Asa y tapón
            ctx.fillStyle = '#7d1418';
            ctx.fillRect(-8, -21, 16, 6);
            ctx.fillStyle = '#3a3a42';
            ctx.fillRect(6, -24, 7, 6);

            // Refuerzo en X y reflejo
            ctx.strokeStyle = 'rgba(255,255,255,0.32)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-7, -9); ctx.lineTo(7, 9);
            ctx.moveTo(7, -9); ctx.lineTo(-7, 9);
            ctx.stroke();

            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.fillRect(-10, -13, 3.5, 20);
            ctx.restore();
        }
    }

    private drawParticles(particles: Particle[]) {
        const ctx = this.ctx;
        ctx.save();
        for (const p of particles) {
            ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
            if (p.glow) {
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 12;
            } else {
                ctx.shadowBlur = 0;
            }
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // ==================================================================
    // VEHÍCULO
    // ==================================================================

    private drawVehicle(
        vehicle: Vehicle,
        controller: VehicleController | null,
        segments: TerrainSegment[],
        timeSec: number
    ) {
        const ctx = this.ctx;
        const cfg = vehicle.getConfig();
        const chassis = vehicle.chassis;

        // 1. Sombra proyectada sobre el suelo
        this.drawVehicleShadow(vehicle, segments);

        // 2. Montantes (por detrás de ruedas y carrocería)
        ctx.save();
        ctx.lineCap = 'round';
        for (const [wheel, offsetX] of [
            [vehicle.rearWheel, cfg.wheelOffsetRearX] as const,
            [vehicle.frontWheel, cfg.wheelOffsetFrontX] as const,
        ]) {
            const a = vehicle.getAnchorWorld(offsetX);
            // Vaina exterior
            ctx.strokeStyle = '#2b2b33';
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(wheel.position.x, wheel.position.y);
            ctx.stroke();
            // Vástago interior: se ve entrar y salir al comprimirse
            ctx.strokeStyle = '#8d8f9c';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(
                a.x + (wheel.position.x - a.x) * 0.55,
                a.y + (wheel.position.y - a.y) * 0.55
            );
            ctx.stroke();
        }
        ctx.restore();

        // 3. Ruedas
        this.drawWheel(vehicle.rearWheel, cfg.wheelRadius, true);
        this.drawWheel(vehicle.frontWheel, cfg.wheelRadius, false);

        // 4. Carrocería. chassis.position está centerOfMassOffsetY px por debajo
        //    del centro geométrico (efecto de Body.setCentre), así que se compensa.
        ctx.save();
        ctx.translate(chassis.position.x, chassis.position.y);
        ctx.rotate(chassis.angle);
        ctx.translate(0, -cfg.centerOfMassOffsetY);
        this.drawBuggyBody(controller, timeSec);
        ctx.restore();
    }

    private drawVehicleShadow(vehicle: Vehicle, segments: TerrainSegment[]) {
        const ctx = this.ctx;
        const cx = vehicle.chassis.position.x;

        // Altura del suelo bajo el coche, leída de los puntos de superficie
        let groundY: number | null = null;
        for (const seg of segments) {
            if (cx < seg.startX || cx > seg.endX) continue;
            const pts = seg.surfacePoints;
            for (let i = 0; i < pts.length - 1; i++) {
                if (cx >= pts[i].x && cx <= pts[i + 1].x) {
                    const t = (cx - pts[i].x) / Math.max(0.001, pts[i + 1].x - pts[i].x);
                    groundY = pts[i].y + (pts[i + 1].y - pts[i].y) * t;
                    break;
                }
            }
            if (groundY !== null) break;
        }
        if (groundY === null) return;

        const height = Math.max(0, groundY - vehicle.chassis.position.y);
        const fade = Math.max(0, 1 - height / 260);
        if (fade <= 0.02) return;

        ctx.save();
        ctx.globalAlpha = 0.34 * fade;
        ctx.fillStyle = '#0d0a06';
        ctx.beginPath();
        ctx.ellipse(cx, groundY + 3, 62 * (0.6 + fade * 0.4), 9 * fade + 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    private drawWheel(wheel: { position: { x: number; y: number }; angle: number }, radius: number, isDrive: boolean) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(wheel.position.x, wheel.position.y);
        ctx.rotate(wheel.angle);

        // Neumático
        ctx.fillStyle = C.WHEEL_TIRE;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Dibujo de la banda de rodadura
        ctx.strokeStyle = '#2e2e38';
        ctx.lineWidth = 3.4;
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * (radius - 4.5), Math.sin(a) * (radius - 4.5));
            ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
            ctx.stroke();
        }

        // Llanta
        ctx.fillStyle = isDrive ? this.accent : C.WHEEL_RIM;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.56, 0, Math.PI * 2);
        ctx.fill();

        // Radios
        ctx.strokeStyle = 'rgba(20,20,26,0.75)';
        ctx.lineWidth = 2.6;
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * radius * 0.54, Math.sin(a) * radius * 0.54);
            ctx.stroke();
        }

        // Buje
        ctx.fillStyle = '#1b1b22';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.19, 0, Math.PI * 2);
        ctx.fill();

        // Reflejo superior del neumático
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 2, Math.PI * 1.15, Math.PI * 1.75);
        ctx.stroke();

        ctx.restore();
    }

    /** Carrocería en coordenadas locales: centro geométrico del chasis en (0,0). */
    private drawBuggyBody(controller: VehicleController | null, timeSec: number) {
        const ctx = this.ctx;
        const accent = this.accent;

        // Bajos y chasis tubular trasero
        ctx.fillStyle = '#23232b';
        this.roundRect(-62, 2, 124, 14, 5);
        ctx.fill();

        // Arco de seguridad
        ctx.strokeStyle = '#33333d';
        ctx.lineWidth = 7;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-34, 2);
        ctx.lineTo(-26, -30);
        ctx.lineTo(6, -34);
        ctx.lineTo(24, -12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-26, -30);
        ctx.lineTo(-44, -6);
        ctx.stroke();

        // Cuerpo principal
        const body = ctx.createLinearGradient(0, -18, 0, 16);
        body.addColorStop(0, this.lighten(accent, 0.35));
        body.addColorStop(0.5, accent);
        body.addColorStop(1, this.darken(accent, 0.45));
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.moveTo(-60, 8);
        ctx.lineTo(-58, -10);
        ctx.lineTo(-30, -16);
        ctx.lineTo(-6, -17);
        ctx.lineTo(26, -14);
        ctx.lineTo(52, -6);
        ctx.lineTo(63, 2);
        ctx.lineTo(62, 10);
        ctx.lineTo(-60, 10);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Franja lateral
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath();
        ctx.moveTo(-56, -6);
        ctx.lineTo(-28, -11);
        ctx.lineTo(-26, -6);
        ctx.lineTo(-54, -1);
        ctx.closePath();
        ctx.fill();

        // Habitáculo
        ctx.fillStyle = '#191920';
        this.roundRect(-30, -16, 40, 20, 4);
        ctx.fill();

        // Asiento
        ctx.fillStyle = '#2f2f3a';
        ctx.beginPath();
        ctx.moveTo(-26, -2);
        ctx.lineTo(-24, -18);
        ctx.lineTo(-14, -18);
        ctx.lineTo(-12, -2);
        ctx.closePath();
        ctx.fill();

        // Piloto: casco del color complementario del perfil
        ctx.fillStyle = '#f4d9c0';
        ctx.beginPath();
        ctx.arc(-6, -22, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.darken(accent, 0.15);
        ctx.beginPath();
        ctx.arc(-6, -24, 8, Math.PI * 0.98, Math.PI * 2.02);
        ctx.fill();
        ctx.fillStyle = '#141419';
        ctx.fillRect(-2.5, -25, 7, 3.5);

        // Faro y haz
        ctx.fillStyle = '#fff2c4';
        ctx.beginPath();
        ctx.ellipse(56, -3, 5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        const beam = ctx.createLinearGradient(58, 0, 150, 0);
        beam.addColorStop(0, 'rgba(255,238,180,0.30)');
        beam.addColorStop(1, 'rgba(255,238,180,0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(58, -5);
        ctx.lineTo(152, -30);
        ctx.lineTo(152, 24);
        ctx.lineTo(58, 1);
        ctx.closePath();
        ctx.fill();

        // Alerón trasero
        ctx.fillStyle = '#2b2b34';
        ctx.fillRect(-70, -26, 20, 5);
        ctx.fillRect(-63, -26, 4, 14);

        // Tubo de escape: brilla al acelerar
        const throttle = controller?.throttle ?? 0;
        ctx.fillStyle = '#3a3a44';
        ctx.fillRect(-70, 0, 12, 6);
        if (throttle > 0.25) {
            ctx.save();
            ctx.globalAlpha = 0.35 + Math.sin(timeSec * 30) * 0.15;
            ctx.fillStyle = '#ff8a3d';
            ctx.beginPath();
            ctx.ellipse(-71, 3, 5 + throttle * 4, 3.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ==================================================================
    // CAPAS DE PANTALLA
    // ==================================================================

    private drawSpeedLines(w: number, h: number, vehicle: Vehicle, timeSec: number) {
        const speed = Math.abs(vehicle.getVelocity().x);
        if (speed < 7) return;

        const ctx = this.ctx;
        const intensity = Math.min(1, (speed - 7) / 8);

        ctx.save();
        ctx.globalAlpha = intensity * 0.3;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 9; i++) {
            const y = ((hash01(i * 4.3) * h) + timeSec * 40 * (0.5 + hash01(i))) % h;
            const len = 40 + hash01(i * 8.1) * 110;
            const x = w - ((timeSec * 900 * (0.6 + hash01(i * 2.7)) + hash01(i * 6.1) * w) % (w + len));
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + len, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    private drawVignette(w: number, h: number) {
        const ctx = this.ctx;
        const grad = ctx.createRadialGradient(
            w / 2, h / 2, Math.min(w, h) * 0.35,
            w / 2, h / 2, Math.max(w, h) * 0.78
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    private drawLowFuelWarning(w: number, h: number, fuel: number, timeSec: number) {
        const threshold = GAME_CONFIG.FUEL.LOW_FUEL_THRESHOLD;
        if (fuel > threshold) return;

        const ctx = this.ctx;
        const urgency = 1 - fuel / threshold;
        const pulse = 0.28 + Math.sin(timeSec * 7) * 0.22;

        ctx.save();
        ctx.globalAlpha = Math.max(0, pulse * urgency);
        const grad = ctx.createRadialGradient(
            w / 2, h / 2, Math.min(w, h) * 0.28,
            w / 2, h / 2, Math.max(w, h) * 0.72
        );
        grad.addColorStop(0, 'rgba(255,60,60,0)');
        grad.addColorStop(1, 'rgba(255,40,40,0.85)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    /**
     * Telemetría de la suspensión en tiempo real (tecla B).
     * Muestra por montante: longitud, compresión, velocidad de compresión,
     * fuerza aplicada y estado del tope de final de recorrido.
     */
    private drawSuspensionTelemetry(struts: StrutTelemetry[]) {
        if (!struts || struts.length === 0) return;
        const ctx = this.ctx;
        const pad = 10;
        // Se baja para no taparse con la barra superior del HUD
        const top = 74;
        const rowH = 15;
        const w = 260;
        const h = pad * 2 + 18 + struts.length * (rowH * 5 + 12);

        ctx.save();
        ctx.font = '11px ui-monospace, monospace';
        ctx.textBaseline = 'top';

        ctx.fillStyle = 'rgba(4,3,10,0.85)';
        ctx.fillRect(pad, top, w, h);
        ctx.strokeStyle = 'rgba(0,255,200,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(pad, top, w, h);

        ctx.fillStyle = '#00ffc8';
        ctx.fillText('SUSPENSIÓN · tiempo real  [B] ocultar', pad + 8, top + 6);

        let y = top + 26;
        for (const s of struts) {
            const label = s.id === 'rear' ? 'TRASERA' : 'DELANTERA';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, pad + 8, y);
            y += rowH;

            const rows: [string, string, string][] = [
                ['longitud', `${s.length.toFixed(2)} px`, '#c8d0e0'],
                ['compresión', `${(s.compression * 100).toFixed(1)} %`, '#c8d0e0'],
                ['vel. compresión', `${s.compressionVelocity >= 0 ? '+' : ''}${s.compressionVelocity.toFixed(2)} px/paso`, '#c8d0e0'],
                ['fuerza', `${s.totalForce >= 0 ? '+' : ''}${s.totalForce.toFixed(4)}`, '#c8d0e0'],
            ];
            for (const [k, v, color] of rows) {
                ctx.fillStyle = 'rgba(255,255,255,0.45)';
                ctx.fillText(k, pad + 16, y);
                ctx.fillStyle = color;
                ctx.textAlign = 'right';
                ctx.fillText(v, pad + w - 12, y);
                ctx.textAlign = 'left';
                y += rowH;
            }

            // Barra de recorrido con la zona del tope marcada
            const barX = pad + 16, barW = w - 40, barY = y + 1;
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fillRect(barX, barY, barW, 6);
            ctx.fillStyle = 'rgba(255,90,90,0.35)';
            ctx.fillRect(barX + barW * 0.68, barY, barW * 0.32, 6);
            const active = s.bumpStopActive || s.reboundStopActive;
            ctx.fillStyle = active ? '#ff5a5a' : '#00ffc8';
            ctx.fillRect(barX, barY, barW * Math.max(0, Math.min(1, s.compression)), 6);

            if (active) {
                ctx.fillStyle = '#ff5a5a';
                ctx.fillText(s.bumpStopActive ? 'TOPE COMPRESIÓN' : 'TOPE EXTENSIÓN', barX, barY + 9);
            }
            y += rowH + 8;
        }
        ctx.restore();
    }

    private drawDebugOverlay(vehicle: Vehicle) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = 'rgba(0,255,200,0.55)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        for (const body of [vehicle.chassis, vehicle.rearWheel, vehicle.frontWheel]) {
            const b = body.bounds;
            ctx.strokeRect(b.min.x, b.min.y, b.max.x - b.min.x, b.max.y - b.min.y);
        }
        ctx.setLineDash([]);
        ctx.fillStyle = '#00ffc8';
        ctx.beginPath();
        ctx.arc(vehicle.chassis.position.x, vehicle.chassis.position.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ==================================================================
    // UTILIDADES
    // ==================================================================

    private roundRect(x: number, y: number, w: number, h: number, r: number) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    private localToWorld(origin: { x: number; y: number }, angle: number, ox: number, oy: number) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return { x: origin.x + ox * cos - oy * sin, y: origin.y + ox * sin + oy * cos };
    }

    private parseColor(color: string): [number, number, number] {
        const hex = color.trim();
        if (hex.startsWith('#')) {
            const v = hex.length === 4
                ? hex.slice(1).split('').map((c) => parseInt(c + c, 16))
                : [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
            if (v.every((n) => Number.isFinite(n))) return [v[0], v[1], v[2]];
        }
        const m = hex.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
        if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
        return [195, 244, 0];
    }

    private lighten(color: string, amount: number): string {
        const [r, g, b] = this.parseColor(color);
        const mix = (c: number) => Math.round(c + (255 - c) * amount);
        return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
    }

    private darken(color: string, amount: number): string {
        const [r, g, b] = this.parseColor(color);
        const mix = (c: number) => Math.round(c * (1 - amount));
        return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
    }
}
