import { performance } from 'perf_hooks';

const mockItems = Array.from({ length: 50 }).map((_, i) => ({
    title: `Place ${i}`,
    author: 'el',
    locationUrl: `https://goo.gl/maps/mock${i}`,
    state: i % 2 === 0 ? 'COMPLETED' : 'TODO'
}));

const mockLocations = Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    nombre: `Place ${i}`,
    created_by: 'el',
    status: 'to-visit',
    latitud: 0,
    longitud: 0
}));

const mockSupabase = {
    from: (table: string) => ({
        select: async () => {
            await new Promise(r => setTimeout(r, 50));
            return { data: mockLocations, error: null };
        },
        insert: async (data: any) => {
            await new Promise(r => setTimeout(r, 50));
            return { error: null };
        },
        update: (data: any) => ({
            eq: async () => {
                await new Promise(r => setTimeout(r, 50));
                return { error: null };
            }
        }),
        upsert: async (data: any) => {
            await new Promise(r => setTimeout(r, 50));
            return { error: null };
        }
    })
};

const mockFetch = async (url: string) => {
    await new Promise(r => setTimeout(r, 100)); // 100ms API latency
    return {
        ok: true,
        json: async () => ({ coords: { lat: 10, lng: 20 } })
    };
};

async function runOriginal() {
    const start = performance.now();
    const { data: currentLocations } = await mockSupabase.from('ubicaciones').select();
    const locationMap = new Map(currentLocations.map((l: any) => [`${l.nombre.toLowerCase()}||${l.created_by}`, l]));

    for (const item of mockItems) {
        const url = item.locationUrl;
        const key = `${item.title.toLowerCase()}||${item.author}`;
        const existingPin = locationMap.get(key);
        const expectedStatus = (item.state === 'COMPLETED' || item.state === 'ARCHIVED') ? 'visited' : 'to-visit';

        if (!existingPin) {
            const res = await mockFetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
            if (res.ok) {
                const resData = await res.json();
                if (resData.coords) {
                    await mockSupabase.from('ubicaciones').insert({});
                }
            }
        } else if (existingPin.status !== expectedStatus) {
            await mockSupabase.from('ubicaciones').update({ status: expectedStatus }).eq('id', existingPin.id);
        }
    }
    const end = performance.now();
    console.log(`Original Time: ${(end - start).toFixed(2)} ms`);
}

async function runOptimized() {
    const start = performance.now();
    const { data: currentLocations } = await mockSupabase.from('ubicaciones').select();
    const locationMap = new Map(currentLocations.map((l: any) => [`${l.nombre.toLowerCase()}||${l.created_by}`, l]));

    const itemsToFetch = [];
    const updatesToPerform = [];

    for (const item of mockItems) {
        const url = item.locationUrl;
        const key = `${item.title.toLowerCase()}||${item.author}`;
        const existingPin = locationMap.get(key);
        const expectedStatus = (item.state === 'COMPLETED' || item.state === 'ARCHIVED') ? 'visited' : 'to-visit';

        if (!existingPin) {
            itemsToFetch.push({ item, url, expectedStatus });
        } else if (existingPin.status !== expectedStatus) {
            updatesToPerform.push({ ...existingPin, status: expectedStatus });
        }
    }

    const fetchPromises = itemsToFetch.map(async ({ item, url, expectedStatus }) => {
        const res = await mockFetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (res.ok) {
            const resData = await res.json();
            if (resData.coords) {
                return { nombre: item.title };
            }
        }
        return null;
    });

    const fetchedResults = await Promise.all(fetchPromises);
    const insertsToPerform = fetchedResults.filter(Boolean);

    const upserts = [...insertsToPerform, ...updatesToPerform];
    if (upserts.length > 0) {
        await mockSupabase.from('ubicaciones').upsert(upserts);
    }

    const end = performance.now();
    console.log(`Optimized Time: ${(end - start).toFixed(2)} ms`);
}

async function main() {
    await runOriginal();
    await runOptimized();
}
main();
