import { test, expect } from '@playwright/test';
import { MahjongService } from '../src/services/mahjongService';

const createMockSupabase = (mockData: Record<string, unknown> = {}, errorToThrow?: Error) => {
    const chainable = {
        select: () => chainable,
        order: () => chainable,
        limit: () => chainable,
        not: () => chainable,
        insert: () => {
            if (errorToThrow) throw errorToThrow;
            return chainable;
        },
        then: (resolve: (val: unknown) => void) => {
            if (errorToThrow) {
                resolve({ data: null, error: errorToThrow });
            } else {
                resolve({ data: mockData.default || [], error: null });
            }
        },
    };

    return {
        from: (table: string) => {
            const tableChainable = { ...chainable };

            const wrapWithThen = (base: Record<string, unknown>) => {
                const wrapped = { ...base };
                wrapped.then = (resolve: (val: unknown) => void) => {
                    if (errorToThrow) {
                         resolve({ data: null, error: errorToThrow });
                    } else {
                         const data = (table in mockData && mockData[table] === null) ? null : (mockData[table] || mockData.default || (Object.keys(mockData).length > 0 && mockData[Object.keys(mockData)[0]] !== null ? mockData[Object.keys(mockData)[0]] : []));
                         resolve({ data, error: null });
                    }
                };

                wrapped.order = () => wrapWithThen(wrapped);
                wrapped.limit = () => wrapWithThen(wrapped);
                wrapped.select = () => wrapWithThen(wrapped);
                wrapped.eq = () => wrapWithThen(wrapped);
                wrapped.not = () => wrapWithThen(wrapped);
                wrapped.insert = () => {
                     if (errorToThrow) throw errorToThrow;
                     return wrapWithThen(wrapped);
                };

                return wrapped;
            };

            return wrapWithThen(tableChainable as unknown as Record<string, unknown>);
        }
    } as unknown as import('@supabase/supabase-js').SupabaseClient;
};

test.describe('MahjongService', () => {
    const originalConsoleError = console.error;
    const originalFetch = global.fetch;

    test.beforeEach(() => {
        console.error = () => {}; // Silence error logs during tests
    });

    test.afterEach(() => {
        console.error = originalConsoleError;
        global.fetch = originalFetch;
    });

    test.describe('saveMahjongScore', () => {
        test('should save a score successfully', async () => {
            const mockSupabase = createMockSupabase();
            let insertCalled = false;

            // Use type casting to mock only what we need
            const mockSupabaseWithInsert = {
                ...mockSupabase,
                from: (table: string) => ({
                    ...mockSupabase.from(table),
                    insert: (data: Record<string, unknown>) => {
                        insertCalled = true;
                        expect(table).toBe('mahjong_scores');
                        expect(data).toEqual({
                            profile: 'el',
                            time_seconds: 120,
                            layout: 'classic',
                            tile_count: 144
                        });
                        return Promise.resolve();
                    }
                })
            } as unknown as import('@supabase/supabase-js').SupabaseClient;

            await MahjongService.saveMahjongScore('el', 120, 'classic', 144, 0, mockSupabaseWithInsert);
            expect(insertCalled).toBe(true);
        });

        test('should handle and log errors gracefully', async () => {
            let errorLogged = false;
            console.error = () => { errorLogged = true; };

            const mockSupabase = createMockSupabase({}, new Error('Insert failed'));

            // Should not throw
            await MahjongService.saveMahjongScore('ella', 90, 'turtle', 144, 0, mockSupabase);
            expect(errorLogged).toBe(true);
        });
    });

    test.describe('getMahjongLeaderboard', () => {
        test('should return formatted leaderboard data separated by profile', async () => {
            const mockData = {
                mahjong_scores: [
                    { profile: 'el', time_seconds: 100 },
                    { profile: 'el', time_seconds: 110 },
                    { profile: 'el', time_seconds: 120 },
                    { profile: 'el', time_seconds: 130 },
                    { profile: 'el', time_seconds: 140 },
                    { profile: 'el', time_seconds: 150 }, // 6th, should be filtered
                    { profile: 'ella', time_seconds: 90 },
                    { profile: 'ella', time_seconds: 95 }
                ]
            };

            const mockSupabase = createMockSupabase(mockData);

            const result = await MahjongService.getMahjongLeaderboard(mockSupabase);

            expect(result.el.length).toBe(5);
            expect(result.el[0].time_seconds).toBe(100);
            expect(result.el[4].time_seconds).toBe(140);

            expect(result.ella.length).toBe(2);
            expect(result.ella[0].time_seconds).toBe(90);
        });

        test('should return empty arrays if there is an error', async () => {
            const mockSupabase = createMockSupabase({}, new Error('Fetch failed'));

            const result = await MahjongService.getMahjongLeaderboard(mockSupabase);

            expect(result).toEqual({ el: [], ella: [] });
        });

        test('should return empty arrays if no data is returned', async () => {
            const mockSupabase = createMockSupabase({ mahjong_scores: null });

            const result = await MahjongService.getMahjongLeaderboard(mockSupabase);

            expect(result).toEqual({ el: [], ella: [] });
        });

        test('should handle completely broken supabase client throwing synchronously', async () => {
            const mockSupabase = {
                from: () => { throw new Error('Synchronous error'); }
            } as unknown as import('@supabase/supabase-js').SupabaseClient;

            const originalConsoleError = console.error;
            let errorLogged = false;

            try {
                console.error = () => { errorLogged = true; };
                const result = await MahjongService.getMahjongLeaderboard(mockSupabase);
                expect(result).toEqual({ el: [], ella: [] });
                expect(errorLogged).toBe(true);
            } finally {
                console.error = originalConsoleError;
            }
        });
    });

    test.describe('getMahjongImages', () => {
        test('should combine images from Supabase and local API, filtering invalid URLs and returning objects', async () => {
            const mockData = {
                events: [
                    { image_url: 'https://example.com/img1.png' },
                    { image_url: '  ' }, // empty string (filtered)
                    { image_url: null }, // null (filtered)
                    { image_url: 'https://example.com/img2.png' }
                ]
            };
            const mockSupabase = createMockSupabase(mockData);

            // Mock local API fetch
            global.fetch = () => Promise.resolve({
                json: () => Promise.resolve(['/local-img1.png', '/local-img2.jpg'])
            } as unknown as Response);

            const images = await MahjongService.getMahjongImages(mockSupabase);

            expect(images.length).toBe(4);
            expect(images).toContainEqual({ url: 'https://example.com/img1.png', source: 'supabase' });
            expect(images).toContainEqual({ url: 'https://example.com/img2.png', source: 'supabase' });
            expect(images).toContainEqual({ url: '/local-img1.png', source: 'local' });
            expect(images).toContainEqual({ url: '/local-img2.jpg', source: 'local' });
        });

        test('should handle fetch API failure gracefully', async () => {
            const mockData = {
                events: [{ image_url: 'https://example.com/img1.png' }]
            };
            const mockSupabase = createMockSupabase(mockData);

            // Mock local API fetch to fail
            global.fetch = () => Promise.reject(new Error('Network error'));

            const images = await MahjongService.getMahjongImages(mockSupabase);

            expect(images.length).toBe(1);
            expect(images).toContainEqual({ url: 'https://example.com/img1.png', source: 'supabase' });
        });

        test('should handle overall failure gracefully', async () => {
            const mockSupabase = createMockSupabase({}, new Error('Database error'));

            const images = await MahjongService.getMahjongImages(mockSupabase);

            expect(images).toEqual([]);
        });
    });
});
