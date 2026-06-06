import { test, expect } from '@playwright/test';
import { isMapLink, StoreService } from '../src/services/storeService';

test.describe('isMapLink function', () => {
    test('should return true for valid Google Maps desktop URLs', () => {
        expect(isMapLink('https://www.google.com/maps/place/Medellin')).toBe(true);
        expect(isMapLink('http://google.com/maps/dir/Bogota/Medellin')).toBe(true);
        expect(isMapLink('https://google.com/maps')).toBe(true);
    });

    test('should return true for valid maps.app.goo.gl short URLs', () => {
        expect(isMapLink('https://maps.app.goo.gl/abc123XYZ')).toBe(true);
        expect(isMapLink('http://maps.app.goo.gl/something')).toBe(true);
    });

    test('should return true for valid goo.gl/maps short URLs', () => {
        expect(isMapLink('https://goo.gl/maps/xyz456ABC')).toBe(true);
        expect(isMapLink('http://goo.gl/maps/dir')).toBe(true);
    });

    test('should return false for other domains and non-map URLs', () => {
        expect(isMapLink('https://www.google.com')).toBe(false);
        expect(isMapLink('https://google.com/search?q=maps')).toBe(false);
        expect(isMapLink('https://github.com')).toBe(false);
        expect(isMapLink('not-a-url')).toBe(false);
    });

    test('should return false for empty strings', () => {
        expect(isMapLink('')).toBe(false);
    });

    test('should return false for null or undefined', () => {
        expect(isMapLink(null)).toBe(false);
        expect(isMapLink(undefined)).toBe(false);
    });
});

const createMockSupabase = (mockData: any = {}) => {
    const chainable = {
        select: () => chainable,
        order: () => chainable,
        limit: () => chainable,
        eq: () => chainable,
        single: () => chainable,
        in: () => chainable,
        match: () => chainable,
        insert: () => chainable,
        update: () => chainable,
        delete: () => chainable,
        upsert: () => chainable,
        not: () => chainable,
        then: (resolve: any) => resolve({ data: mockData.default || [] }),
    };

    return {
        from: (table: string) => {
            const tableChainable = { ...chainable };

            const wrapWithThen = (base: any, isSingle: boolean = false) => {
                const wrapped = { ...base };
                wrapped.then = (resolve: any) => {
                     let data = mockData[table];
                     if (table === 'app_settings') {
                          data = Array.isArray(data) ? data[0] : data || { id: 1, connection_date: new Date().toISOString(), last_update: new Date().toISOString() };
                     } else if (isSingle) {
                          data = Array.isArray(data) ? data[0] : data;
                     } else {
                          data = data || [];
                     }
                     resolve({ data, error: null });
                };

                wrapped.single = () => wrapWithThen(wrapped, true);
                wrapped.in = () => wrapWithThen(wrapped, isSingle);
                wrapped.eq = () => wrapWithThen(wrapped, isSingle);
                wrapped.limit = () => wrapWithThen(wrapped, isSingle);
                wrapped.order = () => wrapWithThen(wrapped, isSingle);
                wrapped.select = () => wrapWithThen(wrapped, isSingle);
                wrapped.match = () => wrapWithThen(wrapped, isSingle);
                wrapped.not = () => wrapWithThen(wrapped, isSingle);
                wrapped.insert = () => wrapWithThen(wrapped, isSingle);
                wrapped.update = () => wrapWithThen(wrapped, isSingle);
                wrapped.delete = () => wrapWithThen(wrapped, isSingle);
                wrapped.upsert = () => wrapWithThen(wrapped, isSingle);

                return wrapped;
            };

            return wrapWithThen(tableChainable);
        },
        storage: {
            from: () => ({
                upload: () => Promise.resolve({ error: null }),
                getPublicUrl: () => ({ data: { publicUrl: 'http://mock-url.com/image.png' } })
            })
        }
    } as any;
};

test.describe('StoreService.getStore success', () => {
    test('should resolve AppData structure when database queries succeed', async () => {
        const mockData = {
            events: [{ id: 'evt1', title: 'Test Event', date: '2025-01-01', description: 'desc' }],
            notes: [{ id: 'note1', text: 'Test Note', author: 'el' }],
            app_settings: { id: 1, connection_date: '2023-01-01T00:00:00Z', last_update: '2025-01-02T00:00:00Z' }, // Keep as single object
            audio_track: [{ id: 'trk1', title: 'Song', artist: 'Artist', spotify_url: 'http://spoti.fi/123' }],
            audio_comments: [{ id: 'cmt1', track_id: 'trk1', text: 'Nice song', author: 'ella' }],
            tasks: [{ id: 'tsk1', text: 'Do laundry', status: 'todo', category: 'home', estimated_time: 30, actual_time: 0 }],
            daily_tracking: [{ date: new Date().toISOString().split('T')[0], total: 5, completed: 3 }],
        };

        const mockSupabase = createMockSupabase(mockData);

        const appData = await StoreService.getStore(mockSupabase);

        expect(appData).toBeDefined();
        expect(appData.events.length).toBe(1);
        expect(appData.events[0].title).toBe('Test Event');

        expect(appData.notes.length).toBe(1);
        expect(appData.notes[0].text).toBe('Test Note');

        expect(appData.audioPlaylist.length).toBe(1);
        expect(appData.audioPlaylist[0].spotifyUrl).toBe('http://spoti.fi/123');
        expect(appData.audioPlaylist[0].comments?.length).toBe(1);
        expect(appData.audioPlaylist[0].comments?.[0].text).toBe('Nice song');

        expect(appData.tasks.length).toBe(1);
        expect(appData.tasks[0].text).toBe('Do laundry');

        // Settings / Pulse check
        expect(appData.audioStats.daysTracking).toBeGreaterThan(0);
    });
});

test.describe('StoreService.getStore error handling', () => {
    test('should throw a "Could not read from data store." error when the database query fails', async () => {
        const mockSupabase = {
            from: () => {
                throw new Error('Database connection failed');
            }
        } as any;

        await expect(StoreService.getStore(mockSupabase)).rejects.toThrow('Could not read from data store.');
    });
});

test.describe('StoreService.updateStore', () => {
    test('should call correct supabase methods for updates and insertions', async () => {
        let calledTables: string[] = [];
        let calledMethods: string[] = [];

        const chainable = {
            select: () => chainable,
            match: () => chainable,
            eq: () => chainable,
            in: () => chainable,
            delete: () => { calledMethods.push('delete'); return chainable; },
            upsert: () => { calledMethods.push('upsert'); return chainable; },
            insert: () => { calledMethods.push('insert'); return chainable; },
            update: () => { calledMethods.push('update'); return chainable; },
            then: (resolve: any) => resolve({ data: [] }),
        };

        const mockSupabase = {
            from: (table: string) => {
                calledTables.push(table);
                return chainable;
            }
        } as any;

        const newData = {
            lastPulseAt: new Date().toISOString(),
            notes: [{ id: 'some-uuid-here-xxxx-yyyy-zzzzzzzzzzzz', text: 'Upsert Note', author: 'el' }, { id: 'temp-123', text: 'New Note', author: 'ella' }]
        };

        await StoreService.updateStore(newData as any, mockSupabase);

        expect(calledTables).toContain('notes');
        expect(calledTables).toContain('app_settings');
        expect(calledMethods).toContain('insert');
        expect(calledMethods).toContain('update');
    });

    test('should throw a "Could not write to data store." error when update fails', async () => {
        const mockSupabase = {
            from: () => {
                throw new Error('Database write failed');
            }
        } as any;

        await expect(StoreService.updateStore({ lastPulseAt: '2025-01-01' } as any, mockSupabase)).rejects.toThrow('Could not write to data store.');
    });
});
