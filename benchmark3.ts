const { performance } = require('perf_hooks');

// In modern v8, Date.now() is usually much faster than new Date()
// Also, doing the date formatting logic is slow no matter what,
// so let's try computing the array *once* per render if we memoize it.
// The current code computes it on EVERY render of the component.
function benchOriginalRenderLoop() {
    // simulate 10000 renders
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

// If we compute the array once and memoize it (useMemo) it only runs when needed.
function benchMemoized() {
    // Only runs once!
    const today = new Date();
    const todayTime = today.getTime();
    const DAY_MS = 24 * 60 * 60 * 1000;

    const memoizedDays = Array.from({ length: 7 }).map((_, index) => {
        const d = new Date(todayTime + (index - 6) * DAY_MS);
        return {
            dStr: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('es-ES', { weekday: 'short' })
        };
    });

    // simulate 10000 renders just using the memoized value
    for (let i = 0; i < 10000; i++) {
        const x = memoizedDays; // Use it
    }
}

const start0 = performance.now();
benchOriginalRenderLoop();
console.log('Original Render Loop:', performance.now() - start0);

const start1 = performance.now();
benchMemoized();
console.log('Memoized Render Loop:', performance.now() - start1);
