const { performance } = require('perf_hooks');

const createMockSupabase = () => {
    let delay = 10; // simulate 10ms network latency
    const wait = () => new Promise(r => setTimeout(r, delay));

    const chainable = (data) => {
        const obj = {
            select: () => obj,
            single: () => obj,
            eq: () => obj,
            in: () => obj,
            match: () => obj,
            order: () => obj,
            limit: () => obj,
            then: (resolve) => wait().then(() => resolve({ data, error: null })),
        };
        return obj;
    };

    return {
        from: (table) => {
            return {
                select: (cols) => chainable([{ id: 'uuid-1', title: 'Track 1' }]),
                insert: (payload) => chainable(Array.isArray(payload) ? payload.map((p, i) => ({ ...p, id: `new-uuid-${i}` })) : { ...payload, id: `new-uuid-single` }),
                update: (payload) => chainable([{ id: 'uuid-1', ...payload }]),
                delete: () => chainable([]),
                upsert: (payload) => chainable(Array.isArray(payload) ? payload : [payload]),
            };
        }
    };
};

async function runBenchmark() {
    const supabase = createMockSupabase();

    // The code we want to test:
    const newData = {
        audioPlaylist: Array.from({ length: 50 }, (_, i) => ({
            id: i < 10 ? 'uuid-1' : Date.now().toString() + i, // 10 existing, 40 new
            title: `Track ${i}`,
            artist: `Artist ${i}`,
            spotifyUrl: `url${i}`,
            comments: [{ author: 'el', text: 'nice' }]
        }))
    };

    const start = performance.now();

    // ORIGINAL CODE REPLICA
    if (newData.audioPlaylist !== undefined) {
        const { data: existingTracks } = await supabase.from('audio_track').select('id, title');
        const existingIds = new Set((existingTracks || []).map((r) => r.id));
        const existingTitles = new Set((existingTracks || []).map((r) => r.title));

        for (const track of newData.audioPlaylist) {
            let trackId = track.id;
            const isNew = !existingIds.has(trackId);

            if (!isNew) {
                await supabase.from('audio_track').update({
                    title: track.title,
                    artist: track.artist,
                    spotify_url: track.spotifyUrl || track.spotify_url || null,
                    display_order: track.display_order || 0,
                    added_by: track.added_by || 'el'
                }).eq('id', trackId);
            } else {
                const res = await supabase.from('audio_track').insert({
                    title: track.title,
                    artist: track.artist,
                    spotify_url: track.spotifyUrl || track.spotify_url || null,
                    display_order: track.display_order || 0,
                    added_by: track.added_by || 'el'
                }).select('id').single();
                trackId = res.data?.id || trackId; // Fallback for mock

                if (track.added_by === 'el' && !existingTitles.has(track.title)) {
                    await supabase.from('notifications').insert({
                        target_profile: 'ella',
                        type: 'new_song',
                        message: `Él agregó una nueva canción: ${track.title}`
                    });
                }
            }

            if (trackId && track.comments) {
                await supabase.from('audio_comments').delete().eq('track_id', trackId);
                if (track.comments.length > 0) {
                    await supabase.from('audio_comments').insert(track.comments.map((c) => ({
                        track_id: trackId,
                        author: c.author,
                        text: c.text
                    })));
                }
            }
        }

        const incomingIds = newData.audioPlaylist.map(t => t.id);
        const toDelete = (existingTracks || []).filter(r => !incomingIds.includes(r.id)).map(r => r.id);
        if (toDelete.length > 0) await supabase.from('audio_track').delete().in('id', toDelete);
    }

    const end = performance.now();
    console.log(`Original Code Time: ${(end - start).toFixed(2)}ms`);
}

runBenchmark();

async function runOptimizedBenchmark() {
    const supabase = createMockSupabase();

    const newData = {
        audioPlaylist: Array.from({ length: 50 }, (_, i) => ({
            id: i < 10 ? 'uuid-1' : Date.now().toString() + i, // 10 existing, 40 new
            title: `Track ${i}`,
            artist: `Artist ${i}`,
            spotifyUrl: `url${i}`,
            comments: [{ author: 'el', text: 'nice' }],
            added_by: 'el'
        }))
    };

    const start = performance.now();

    // OPTIMIZED CODE DRAFT
    if (newData.audioPlaylist !== undefined) {
        const { data: existingTracks } = await supabase.from('audio_track').select('id, title');
        const existingIds = new Set((existingTracks || []).map((r) => r.id));
        const existingTitles = new Set((existingTracks || []).map((r) => r.title));

        const toUpsert = [];
        const toInsert = [];
        const newTrackNotifications = [];

        for (const track of newData.audioPlaylist) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(track.id);
            // mock simplified uuid check:
            const isExisting = existingIds.has(track.id);

            if (isExisting) {
                toUpsert.push({
                    id: track.id,
                    title: track.title,
                    artist: track.artist,
                    spotify_url: track.spotifyUrl || track.spotify_url || null,
                    display_order: track.display_order || 0,
                    added_by: track.added_by || 'el'
                });
            } else {
                toInsert.push({
                    // Intentionally omitting ID if we want Supabase to generate it,
                    // OR we send the fields and handle it.
                    // Wait, the current code just generates a date-based ID on frontend, inserts, and selects it back.
                    title: track.title,
                    artist: track.artist,
                    spotify_url: track.spotifyUrl || track.spotify_url || null,
                    display_order: track.display_order || 0,
                    added_by: track.added_by || 'el',
                    // Pass a temp ref so we can map comments later if needed
                    _tempRefId: track.id
                });

                if (track.added_by === 'el' && !existingTitles.has(track.title)) {
                    newTrackNotifications.push({
                        target_profile: 'ella',
                        type: 'new_song',
                        message: `Él agregó una nueva canción: ${track.title}`
                    });
                }
            }
        }

        // Bulk operations
        if (toUpsert.length > 0) {
            await supabase.from('audio_track').upsert(toUpsert);
        }

        let insertedMap = {};
        if (toInsert.length > 0) {
            // Need to insert and return inserted rows to get the new IDs for comments
            const { data: insertedTracks } = await supabase.from('audio_track').insert(toInsert.map(t => {
                const { _tempRefId, ...rest } = t;
                return rest;
            })).select('id, title');

            // Map them back if we can - actually, Supabase insert returns the items in order?
            // Safer to use a property or just assume order if we don't have a unique ID.
            // In the original code, it inserts ONE BY ONE.
        }

        // What about comments? The original code deletes ALL comments for the track and inserts new ones.
        // For bulk, we could delete ALL comments for all incoming track IDs, then bulk insert.
    }

    const end = performance.now();
    console.log(`Optimized Code Time: ${(end - start).toFixed(2)}ms`);
}

runOptimizedBenchmark();
