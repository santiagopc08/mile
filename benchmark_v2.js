const { performance } = require('perf_hooks');

const createMockSupabase = () => {
    let delay = 5; // simulate 5ms network latency
    let queryCount = 0;
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
            then: (resolve) => {
                queryCount++;
                return wait().then(() => resolve({ data, error: null }));
            },
        };
        return obj;
    };

    const mockTable = (table) => {
        return {
            select: (cols) => chainable([{ id: 'uuid-1', title: 'Track 1' }]),
            insert: (payload) => chainable(Array.isArray(payload) ? payload.map((p, i) => ({ ...p, id: `new-uuid-${i}` })) : { ...payload, id: `new-uuid-single` }),
            update: (payload) => chainable([{ id: 'uuid-1', ...payload }]),
            delete: () => chainable([]),
            upsert: (payload) => chainable(Array.isArray(payload) ? payload : [payload]),
        };
    };

    return {
        from: mockTable,
        getQueryCount: () => queryCount,
        resetQueryCount: () => { queryCount = 0; }
    };
};

async function testBoth() {
    const supabase = createMockSupabase();

    // The code we want to test: 50 existing tracks, 1 new track
    const newData = {
        audioPlaylist: Array.from({ length: 51 }, (_, i) => ({
            id: i < 50 ? `uuid-${i}` : Date.now().toString() + i, // 50 existing, 1 new
            title: `Track ${i}`,
            artist: `Artist ${i}`,
            spotifyUrl: `url${i}`,
            comments: [{ author: 'el', text: 'nice' }]
        }))
    };

    // --- ORIGINAL ---
    supabase.resetQueryCount();
    const start1 = performance.now();

    const { data: existingTracks } = await supabase.from('audio_track').select('id, title');
    // fake the existing tracks so 50 are existing
    const existingIds = new Set(Array.from({length: 50}, (_, i) => `uuid-${i}`));
    const existingTitles = new Set();

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
            trackId = res.data?.id || trackId;

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

    const end1 = performance.now();
    const qCount1 = supabase.getQueryCount();


    // --- OPTIMIZED ---
    supabase.resetQueryCount();
    const start2 = performance.now();

    const { data: existingTracks2 } = await supabase.from('audio_track').select('id, title');
    const existingIds2 = new Set(Array.from({length: 50}, (_, i) => `uuid-${i}`));
    const existingTitles2 = new Set();

    const toUpsertTracks = [];
    const toDeleteCommentsTrackIds = [];
    const toInsertComments = [];
    const notificationsToInsert = [];

    for (const track of newData.audioPlaylist) {
        const isNew = !existingIds2.has(track.id);
        if (!isNew) {
            toUpsertTracks.push({
                id: track.id,
                title: track.title,
                artist: track.artist,
                spotify_url: track.spotifyUrl || track.spotify_url || null,
                display_order: track.display_order || 0,
                added_by: track.added_by || 'el'
            });

            if (track.comments) {
                toDeleteCommentsTrackIds.push(track.id);
                if (track.comments.length > 0) {
                    toInsertComments.push(...track.comments.map((c) => ({
                        track_id: track.id,
                        author: c.author,
                        text: c.text
                    })));
                }
            }
        }
    }

    if (toUpsertTracks.length > 0) await supabase.from('audio_track').upsert(toUpsertTracks);
    if (toDeleteCommentsTrackIds.length > 0) await supabase.from('audio_comments').delete().in('track_id', toDeleteCommentsTrackIds);
    if (toInsertComments.length > 0) await supabase.from('audio_comments').insert(toInsertComments);

    for (const track of newData.audioPlaylist) {
        const isNew = !existingIds2.has(track.id);
        if (isNew) {
            const res = await supabase.from('audio_track').insert({
                title: track.title,
                artist: track.artist,
                spotify_url: track.spotifyUrl || track.spotify_url || null,
                display_order: track.display_order || 0,
                added_by: track.added_by || 'el'
            }).select('id').single();
            const trackId = res.data?.id || track.id;

            if (track.added_by === 'el' && !existingTitles2.has(track.title)) {
                notificationsToInsert.push({
                    target_profile: 'ella',
                    type: 'new_song',
                    message: `Él agregó una nueva canción: ${track.title}`
                });
            }

            if (trackId && track.comments) {
                if (track.comments.length > 0) {
                    await supabase.from('audio_comments').insert(track.comments.map((c) => ({
                        track_id: trackId,
                        author: c.author,
                        text: c.text
                    })));
                }
            }
        }
    }

    if (notificationsToInsert.length > 0) {
        await supabase.from('notifications').insert(notificationsToInsert);
    }

    const incomingIds2 = newData.audioPlaylist.map(t => t.id);
    const toDelete2 = (existingTracks2 || []).filter(r => !incomingIds2.includes(r.id)).map(r => r.id);
    if (toDelete2.length > 0) await supabase.from('audio_track').delete().in('id', toDelete2);

    const end2 = performance.now();
    const qCount2 = supabase.getQueryCount();

    console.log(`Original Time: ${(end1 - start1).toFixed(2)}ms, Queries: ${qCount1}`);
    console.log(`Optimized Time: ${(end2 - start2).toFixed(2)}ms, Queries: ${qCount2}`);
}

testBoth();
