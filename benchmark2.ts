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

function benchOptimized3() {
    for (let i = 0; i < 10000; i++) {
        const today = new Date();
        const baseDate = today.getDate() - 6;

        Array.from({ length: 7 }).map((_, index) => {
            const d = new Date(today);
            d.setDate(baseDate + index);
            const dStr = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('es-ES', { weekday: 'short' });
            return { dStr, label };
        });
    }
}

function benchOptimized4() {
    for (let i = 0; i < 10000; i++) {
        const today = new Date();
        const todayTime = today.getTime();
        const DAY_MS = 24 * 60 * 60 * 1000;

        Array.from({ length: 7 }).map((_, index) => {
            // (index - 6) gives -6, -5, ..., 0
            const d = new Date(todayTime + (index - 6) * DAY_MS);
            const dStr = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('es-ES', { weekday: 'short' });
            return { dStr, label };
        });
    }
}

// Even better: precalculate the array outside the map
function benchOptimized5() {
    for (let i = 0; i < 10000; i++) {
        const todayTime = Date.now();
        const DAY_MS = 24 * 60 * 60 * 1000;
        const days = Array.from({ length: 7 }).map((_, index) => {
            const d = new Date(todayTime + (index - 6) * DAY_MS);
            return {
                dStr: d.toISOString().split('T')[0],
                label: d.toLocaleDateString('es-ES', { weekday: 'short' })
            };
        });
    }
}

const start0 = performance.now();
benchOriginal();
console.log('Original:', performance.now() - start0);

const start3 = performance.now();
benchOptimized3();
console.log('Optimized 3 (setDate offset):', performance.now() - start3);

const start4 = performance.now();
benchOptimized4();
console.log('Optimized 4 (ms offset):', performance.now() - start4);

const start5 = performance.now();
benchOptimized5();
console.log('Optimized 5 (precalc ms):', performance.now() - start5);
