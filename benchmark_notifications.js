const { performance } = require('perf_hooks');

async function runBenchmark() {
    // Setup mock data
    const newData = {
        persistentListening: Array.from({ length: 10000 }, (_, i) => ({
            id: `id-${i}`,
            topic: `Topic ${i}`,
            reflection: 'Blah blah',
            date: '2023-10-01',
            author: 'el'
        }))
    };

    const existingRows = Array.from({ length: 5000 }, (_, i) => ({
        id: `id-${i}`,
        topic: `Topic ${i}`
    }));

    const existingTopics = new Set((existingRows || []).map((r) => r.topic));

    const start = performance.now();

    // ORIGINAL CODE REPLICA (with O(N) find)
    const notificationsToInsert = [];
    for (const item of newData.persistentListening) {
        if (!existingRows?.find(r => r.id === item.id) && !existingTopics.has(item.topic)) {
             notificationsToInsert.push({
                target_profile: 'ella',
                type: 'escucha',
                message: `Él agregó una nueva reflexión a la Escucha Persistente: "${item.topic}".`
            });
        }
    }

    const end = performance.now();
    console.log(`Original Code Time: ${(end - start).toFixed(2)}ms`);
}

async function runOptimizedBenchmark() {
    // Setup mock data
    const newData = {
        persistentListening: Array.from({ length: 10000 }, (_, i) => ({
            id: `id-${i}`,
            topic: `Topic ${i}`,
            reflection: 'Blah blah',
            date: '2023-10-01',
            author: 'el'
        }))
    };

    const existingRows = Array.from({ length: 5000 }, (_, i) => ({
        id: `id-${i}`,
        topic: `Topic ${i}`
    }));

    const existingTopics = new Set((existingRows || []).map((r) => r.topic));

    const start = performance.now();

    // OPTIMIZED CODE DRAFT
    const existingIds = new Set((existingRows || []).map((r) => r.id));
    const notificationsToInsert = [];
    for (const item of newData.persistentListening) {
        if (!existingIds.has(item.id) && !existingTopics.has(item.topic)) {
             notificationsToInsert.push({
                target_profile: 'ella',
                type: 'escucha',
                message: `Él agregó una nueva reflexión a la Escucha Persistente: "${item.topic}".`
            });
        }
    }

    const end = performance.now();
    console.log(`Optimized Code Time: ${(end - start).toFixed(2)}ms`);
}

async function main() {
    await runBenchmark();
    await runOptimizedBenchmark();
}

main();
