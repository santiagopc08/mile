const { performance } = require('perf_hooks');

function benchOriginal() {
    for (let i = 0; i < 10000; i++) {
        Array.from({ length: 7 }).map((_, index) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - index));
            const dStr = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('es-ES', { weekday: 'short' });
            return { dStr, label };
        });
    }
}

function benchOptimized1() {
    for (let i = 0; i < 10000; i++) {
        const today = new Date();
        Array.from({ length: 7 }).map((_, index) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - index));
            const dStr = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('es-ES', { weekday: 'short' });
            return { dStr, label };
        });
    }
}

function benchOptimized2() {
    for (let i = 0; i < 10000; i++) {
        const baseTime = Date.now();
        const DAY = 86400000;
        Array.from({ length: 7 }).map((_, index) => {
            const d = new Date(baseTime - (6 - index) * DAY);
            const dStr = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('es-ES', { weekday: 'short' });
            return { dStr, label };
        });
    }
}

const start0 = performance.now();
benchOriginal();
console.log('Original:', performance.now() - start0);

const start1 = performance.now();
benchOptimized1();
console.log('Optimized 1:', performance.now() - start1);

const start2 = performance.now();
benchOptimized2();
console.log('Optimized 2:', performance.now() - start2);
