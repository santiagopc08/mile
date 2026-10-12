import { performance } from 'perf_hooks';

interface Bullet { x: number; y: number; vx: number; vy: number; life: number; }
interface Rock { id: number; x: number; y: number; vx: number; vy: number; tier: number; radius: number; rotation: number; spin: number; silhouette: any[]; color: string; }

const V_WIDTH = 1280;
const V_HEIGHT = 720;
const NUM_BULLETS = 1000;
const NUM_ROCKS = 1000;

function runBaseline(bullets: Bullet[], rocks: Rock[]) {
    let hits = 0;
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        let bulletHit = false;
        for (let j = rocks.length - 1; j >= 0; j--) {
            const r = rocks[j];
            const dist = Math.hypot(b.x - r.x, b.y - r.y);
            if (dist < r.radius) {
                bulletHit = true;
                rocks.splice(j, 1);
                hits++;
                break;
            }
        }
        if (bulletHit) {
            bullets.splice(i, 1);
        }
    }
    return hits;
}

function runOptimized(bullets: Bullet[], rocks: Rock[]) {
    let hits = 0;

    // Create spatial grid
    const CELL_SIZE = 100; // Optimal cell size depending on max rock radius
    const cols = Math.ceil(V_WIDTH / CELL_SIZE);
    const rows = Math.ceil(V_HEIGHT / CELL_SIZE);

    // Instead of Map, we can use a flat array of arrays for faster access
    const grid: Rock[][] = Array.from({ length: cols * rows }, () => []);

    for (let j = 0; j < rocks.length; j++) {
        const r = rocks[j];
        // Wrap around logic for rocks not needed for grid placement if we just clamp,
        // but rocks wrap around screen. We assume rock x,y are within 0..V_WIDTH, 0..V_HEIGHT
        const minX = Math.max(0, Math.floor((r.x - r.radius) / CELL_SIZE));
        const maxX = Math.min(cols - 1, Math.floor((r.x + r.radius) / CELL_SIZE));
        const minY = Math.max(0, Math.floor((r.y - r.radius) / CELL_SIZE));
        const maxY = Math.min(rows - 1, Math.floor((r.y + r.radius) / CELL_SIZE));

        for (let cy = minY; cy <= maxY; cy++) {
            for (let cx = minX; cx <= maxX; cx++) {
                grid[cy * cols + cx].push(r);
            }
        }
    }

    const hitRocks = new Set<number>();

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        let bulletHit = false;

        const cx = Math.floor(b.x / CELL_SIZE);
        const cy = Math.floor(b.y / CELL_SIZE);

        if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
            const cell = grid[cy * cols + cx];
            for (let k = 0; k < cell.length; k++) {
                const r = cell[k];
                if (hitRocks.has(r.id)) continue;

                const dist = Math.hypot(b.x - r.x, b.y - r.y);
                if (dist < r.radius) {
                    bulletHit = true;
                    hitRocks.add(r.id);
                    hits++;
                    break;
                }
            }
        }

        if (bulletHit) {
            bullets.splice(i, 1);
        }
    }

    // Remove rocks that were hit
    if (hitRocks.size > 0) {
        for (let j = rocks.length - 1; j >= 0; j--) {
            if (hitRocks.has(rocks[j].id)) {
                rocks.splice(j, 1);
            }
        }
    }

    return hits;
}

// Generate data
function generateData() {
    const bullets: Bullet[] = Array.from({ length: NUM_BULLETS }, () => ({
        x: Math.random() * V_WIDTH,
        y: Math.random() * V_HEIGHT,
        vx: 0, vy: 0, life: 1
    }));

    const rocks: Rock[] = Array.from({ length: NUM_ROCKS }, (_, i) => ({
        id: i,
        x: Math.random() * V_WIDTH,
        y: Math.random() * V_HEIGHT,
        vx: 0, vy: 0,
        tier: 1,
        radius: 17,
        rotation: 0, spin: 0, silhouette: [], color: ''
    }));
    return { bullets, rocks };
}

let data = generateData();
const startBaseline = performance.now();
const hitsBaseline = runBaseline(data.bullets, data.rocks);
const endBaseline = performance.now();

data = generateData();
const startOptimized = performance.now();
const hitsOptimized = runOptimized(data.bullets, data.rocks);
const endOptimized = performance.now();

console.log(`Baseline O(N*M) time: ${(endBaseline - startBaseline).toFixed(2)} ms (Hits: ${hitsBaseline})`);
console.log(`Optimized grid time: ${(endOptimized - startOptimized).toFixed(2)} ms (Hits: ${hitsOptimized})`);
